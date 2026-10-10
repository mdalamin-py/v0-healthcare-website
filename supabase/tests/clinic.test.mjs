import { PGlite } from "@electric-sql/pglite"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

// Runs the clinic migration and seed in an in-memory Postgres (PGlite) and
// verifies booking rules and row level security. Usage: pnpm test:db
const root = fileURLToPath(new URL("../", import.meta.url))
const db = new PGlite()

// Minimal stand-ins for the Supabase environment.
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`)

for (const file of readdirSync(`${root}migrations`).sort()) {
  await db.exec(readFileSync(`${root}migrations/${file}`, "utf8"))
}
await db.exec(readFileSync(`${root}seed.sql`, "utf8"))

let failures = 0
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`)
  if (!ok) failures++
}
const q = async (sql, params) => (await db.query(sql, params)).rows
const expectError = async (label, sql, params, code) => {
  try {
    await db.query(sql, params)
    check(label, false, "no error raised")
  } catch (e) {
    check(label, code.split("|").some((c) => e.message.includes(c)), e.message)
  }
}

const counts = await q(`select (select count(*) from doctors)::int d, (select count(*) from doctor_schedules)::int s, (select count(*) from on_call_shifts)::int o`)
check("seed loaded", counts[0].d === 6 && counts[0].s === 16 && counts[0].o === 28, JSON.stringify(counts[0]))

const onCallNow = await q(`select d.full_name from on_call_shifts o join doctors d on d.id=o.doctor_id where now() between o.starts_at and o.ends_at`)
check("exactly one doctor is on call now", onCallNow.length === 1, JSON.stringify(onCallNow))

const PATIENT_1 = "00000000-0000-0000-0000-0000000000a1"
const PATIENT_2 = "00000000-0000-0000-0000-0000000000a2"
await q(`insert into auth.users values ($1,'p1@x.com'), ($2,'p2@x.com')`, [PATIENT_1, PATIENT_2])
const asPatient = (id) => db.exec(`set request.jwt.claim.sub = '${id}'`)

{
  const guestDoctor = (await q(`select id from doctors where slug='michael-patel'`))[0].id
  const guestSlot = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() limit 1`, [guestDoctor]))[0]
  await expectError(
    "booking without an account is rejected",
    `select * from book_appointment($1, $2, 'Guest', '5550001111')`,
    [guestSlot.schedule_id, guestSlot.appointment_date.toISOString().slice(0, 10)],
    "AUTH_REQUIRED",
  )
}
await asPatient(PATIENT_1)

const doctor = (await q(`select id from doctors where slug='daniel-ramirez'`))[0].id
const avail = await q(`select * from get_availability($1, 30)`, [doctor])
check("availability returns upcoming sessions", avail.length > 0, `${avail.length} sessions`)
const allMatchWeekday = (await q(
  `select bool_and(extract(dow from a.appointment_date) = s.weekday) ok from get_availability($1, 30) a join doctor_schedules s on s.id=a.schedule_id`,
  [doctor],
))[0].ok
check("availability dates match session weekday", allMatchWeekday === true)

// Pick a future session (not today) with small capacity for testing.
await q(`update doctor_schedules set max_patients = 2 where id = $1`, [avail.find((a) => a.appointment_date > avail[0].appointment_date || avail.length === 1)?.schedule_id ?? avail[0].schedule_id])
const target = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() order by appointment_date limit 1`, [doctor]))[0]
const sid = target.schedule_id
const day = target.appointment_date.toISOString().slice(0, 10)

const b1 = (await q(`select * from book_appointment($1,$2,'Jane Doe','(559) 111-2222','jane@x.com',70,'female','Check-up')`, [sid, day]))[0]
check("first booking gets serial 1", b1.serial_no === 1, `${b1.reference} serial ${b1.serial_no}`)
check("reference format", /^DHC-[0-9A-F]{8}$/.test(b1.reference), b1.reference)

await expectError("duplicate phone same session rejected", `select * from book_appointment($1,$2,'Jane Again','559-111-2222')`, [sid, day], "DUPLICATE_BOOKING")

const max = (await q(`select max_patients from doctor_schedules where id=$1`, [sid]))[0].max_patients
const b2 = (await q(`select * from book_appointment($1,$2,'John Roe','5593334444')`, [sid, day]))[0]
check("second booking gets serial 2", b2.serial_no === 2)
if (max === 2) {
  await expectError("full session rejected", `select * from book_appointment($1,$2,'Third Person','5595556666')`, [sid, day], "SESSION_FULL")
}

const wrongDay = new Date(target.appointment_date.getTime() + 86400000).toISOString().slice(0, 10)
await expectError("wrong weekday rejected", `select * from book_appointment($1,$2,'X Person','5597778888')`, [sid, wrongDay], "INVALID_DATE")
await expectError("past date rejected", `select * from book_appointment($1,'2020-01-06','X Person','5597778888')`, [sid], "INVALID_DATE")
await expectError("bad phone rejected", `select * from book_appointment($1,$2,'X Person','123')`, [sid, day], "INVALID_PATIENT")

const look = await q(`select * from lookup_appointment($1, '559.111.2222')`, [b1.reference.toLowerCase()])
check("lookup by reference + phone (normalized)", look.length === 1 && look[0].serial_no === 1, JSON.stringify(look[0]?.status))
const lookWrong = await q(`select * from lookup_appointment($1, '0000000000')`, [b1.reference])
check("lookup with wrong phone returns nothing", lookWrong.length === 0)

const cancelled = (await q(`select cancel_appointment($1,'5591112222') ok`, [b1.reference]))[0].ok
check("patient can cancel", cancelled === true)
const again = (await q(`select cancel_appointment($1,'5591112222') ok`, [b1.reference]))[0].ok
check("cancel is not repeatable", again === false)

const b3 = (await q(`select * from book_appointment($1,$2,'New Person','5599990000')`, [sid, day]))[0]
check("freed slot can be rebooked with next serial (3)", b3.serial_no === 3, `serial ${b3.serial_no}`)

// Visit types
const emily = (await q(`select id from doctors where slug='emily-nguyen'`))[0].id
const emilySlot = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() limit 1`, [emily]))[0]
const emilyDay = emilySlot.appointment_date.toISOString().slice(0, 10)
await expectError("visit type not offered by doctor rejected", `select * from book_appointment($1,$2,'Video Person','5591230000', p_visit_type => 'video')`, [emilySlot.schedule_id, emilyDay], "VISIT_TYPE_UNAVAILABLE")
const sarah = (await q(`select id from doctors where slug='sarah-johnson'`))[0].id
const sarahSlot = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() limit 1`, [sarah]))[0]
const sarahDay = sarahSlot.appointment_date.toISOString().slice(0, 10)
await expectError("home visit without address rejected", `select * from book_appointment($1,$2,'Home Person','5591231111', p_visit_type => 'home_visit')`, [sarahSlot.schedule_id, sarahDay], "ADDRESS_REQUIRED")
const home = (await q(`select * from book_appointment($1,$2,'Home Person','5591231111', p_visit_type => 'home_visit', p_address => '12 Elm St, Fresno')`, [sarahSlot.schedule_id, sarahDay]))[0]
check("home visit booked with address", home.visit_type === "home_visit")
const homeRow = (await q(`select patient_address from appointments where reference=$1`, [home.reference]))[0]
check("address stored", homeRow.patient_address === "12 Elm St, Fresno")
const video = (await q(`select * from book_appointment($1,$2,'Video Person','5591232222', p_visit_type => 'video', p_address => 'ignored')`, [sarahSlot.schedule_id, sarahDay]))[0]
const videoRow = (await q(`select patient_address from appointments where reference=$1`, [video.reference]))[0]
check("address dropped for non-home visits", videoRow.patient_address === null)
const lookedUp = (await q(`select * from lookup_appointment($1,'5591232222')`, [video.reference]))[0]
check("lookup returns visit type", lookedUp.visit_type === "video")

// Patient accounts
const linked = (await q(`select count(*)::int c from appointments where patient_id = $1`, [PATIENT_1]))[0].c
check("bookings are linked to the signed-in patient", linked >= 3, `${linked} linked`)
await db.exec(`set role authenticated`)
const own = await q(`select count(*)::int c from appointments`)
await asPatient(PATIENT_2)
const other = await q(`select count(*)::int c from appointments`)
check("patients see only their own appointments", own[0].c >= 3 && other[0].c === 0, `p1=${own[0].c} p2=${other[0].c}`)
const victim = (await (async () => { await db.exec(`reset role`); return q(`select id from appointments where patient_id=$1 and status <> 'cancelled' limit 1`, [PATIENT_1]) })())[0].id
const stolen = (await q(`select cancel_my_appointment($1) ok`, [victim]))[0].ok
check("patient cannot cancel someone else's appointment", stolen === false)
await asPatient(PATIENT_1)
const mine = (await q(`select cancel_my_appointment($1) ok`, [victim]))[0].ok
check("patient can cancel own appointment", mine === true)
await db.exec(`set request.jwt.claim.sub = ''`)

// Live queue (uses a session scheduled today, if any)
{
  const todaySession = (await q(`select id from doctor_schedules where weekday = extract(dow from clinic_today()) limit 1`))[0]
  if (todaySession) {
    await db.exec(`update doctor_schedules set end_time = '23:59' where id = '${todaySession.id}'`)
    await asPatient(PATIENT_2)
    const today = (await q(`select clinic_today()::text d`))[0].d
    const a1 = (await q(`select * from book_appointment($1, $2, 'Queue One', '5552220001')`, [todaySession.id, today]))[0]
    const a2 = (await q(`select * from book_appointment($1, $2, 'Queue Two', '5552220002')`, [todaySession.id, today]))[0]
    await expectError("non-admin cannot call next patient", `select call_next_patient($1)`, [todaySession.id], "FORBIDDEN")
    await db.exec(`set request.jwt.claim.sub = ''`)
    const before = (await q(`select * from get_today_queue() where schedule_id = $1`, [todaySession.id]))[0]
    check("queue starts at zero with patients waiting", before.now_serving === 0 && before.waiting === 2, JSON.stringify(before))
    await q(`insert into admins values ($1) on conflict do nothing`, [PATIENT_1])
    await asPatient(PATIENT_1)
    const first = (await q(`select call_next_patient($1) n`, [todaySession.id]))[0].n
    const second = (await q(`select call_next_patient($1) n`, [todaySession.id]))[0].n
    check("call next advances through serials", first === a1.serial_no && second === a2.serial_no, `${first},${second}`)
    const completed = (await q(`select status from appointments where reference=$1`, [a1.reference]))[0].status
    check("previous patient marked completed", completed === "completed")
    const after = (await q(`select * from get_today_queue() where schedule_id = $1`, [todaySession.id]))[0]
    check("waiting count drops as queue advances", after.waiting === 0 && after.now_serving === a2.serial_no, JSON.stringify(after))
    await q(`delete from admins where user_id = $1`, [PATIENT_1])
    await db.exec(`set request.jwt.claim.sub = ''`)
  } else {
    console.log("SKIP  live queue (no session scheduled today)")
  }
}

// Callback requests
{
  const id1 = (await q(`select request_callback('Rita Gomez', '(559) 444-1111', 'Chest tightness since morning') id`))[0].id
  const id2 = (await q(`select request_callback('Rita G', '559-444-1111', 'Following up on my call') id`))[0].id
  check("duplicate open callback for same phone is merged", id1 === id2)
  await expectError("invalid callback rejected", `select request_callback('R', '12', 'x')`, [], "INVALID_REQUEST")
  await db.exec(`set role anon`)
  const visible = await q(`select count(*)::int c from callback_requests`)
  await db.exec(`reset role`)
  check("anon cannot read callback requests", visible[0].c === 0)
}

// Doctor reviews
{
  await q(`insert into patients (user_id, full_name, phone) values ($1, 'Maria Gonzalez', '5550002222') on conflict do nothing`, [PATIENT_1])
  const done = (await q(`select id, doctor_id from appointments where patient_id = $1 and status <> 'completed' limit 1`, [PATIENT_1]))[0]
  await asPatient(PATIENT_1)
  await expectError("cannot review a visit that is not completed", `select submit_review($1, 5, 'Great')`, [done.id], "NOT_ELIGIBLE")
  await db.exec(`set request.jwt.claim.sub = ''`)
  await q(`update appointments set status = 'completed' where id = $1`, [done.id])
  await asPatient(PATIENT_2)
  await expectError("cannot review someone else's visit", `select submit_review($1, 5, 'Great')`, [done.id], "NOT_ELIGIBLE")
  await asPatient(PATIENT_1)
  await expectError("rating must be 1-5", `select submit_review($1, 9, 'x')`, [done.id], "INVALID_RATING")
  const reviewId = (await q(`select submit_review($1, 4, 'Very caring doctor') id`, [done.id]))[0].id
  check("patient can review a completed visit", Boolean(reviewId))
  await expectError("only one review per visit", `select submit_review($1, 5, 'Again')`, [done.id], "ALREADY_REVIEWED")
  await db.exec(`set request.jwt.claim.sub = ''`)
  const author = (await q(`select author_name from doctor_reviews where id = $1`, [reviewId]))[0].author_name
  check("author name is first name and initial", author === "Maria G.", author)
  await db.exec(`set role anon`)
  const pendingVisible = (await q(`select count(*)::int c from doctor_reviews`))[0].c
  await db.exec(`reset role`)
  check("pending reviews are hidden from the public", pendingVisible === 0)
  await q(`update doctor_reviews set status = 'approved' where id = $1`, [reviewId])
  const ratings = await q(`select * from get_doctor_ratings() where doctor_id = $1`, [done.doctor_id])
  check("approved review counts toward the rating", ratings[0]?.total === 1 && Number(ratings[0]?.average) === 4, JSON.stringify(ratings[0]))
}

// Doctor availability: leave days and paused bookings
{
  const doc = (await q(`select id from doctors where slug = 'michael-patel'`))[0].id
  const slot = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() limit 1`, [doc]))[0]
  const day = slot.appointment_date.toISOString().slice(0, 10)
  await q(`insert into doctor_leaves (doctor_id, leave_date, reason) values ($1, $2, 'Conference')`, [doc, day])
  const after = await q(`select * from get_availability($1, 30) where appointment_date = $2`, [doc, day])
  check("leave day removed from availability", after.length === 0)
  await asPatient(PATIENT_1)
  await expectError("booking on a leave day is rejected", `select * from book_appointment($1, $2, 'Leave Test', '5553330000')`, [slot.schedule_id, day], "DOCTOR_ON_LEAVE")
  await db.exec(`set request.jwt.claim.sub = ''`)
  const roster = (await q(`select * from get_doctor_roster($1, 1) where doctor_id = $2`, [day, doc]))[0]
  check("roster shows doctor on leave with reason", roster.status === "leave" && roster.leave_reason === "Conference", JSON.stringify(roster))
  await q(`delete from doctor_leaves where doctor_id = $1`, [doc])
  const back = (await q(`select * from get_doctor_roster($1, 1) where doctor_id = $2`, [day, doc]))[0]
  check("removing leave makes the doctor available again", back.status === "available" && back.sessions.length > 0)
  await q(`update doctors set accepting_appointments = false where id = $1`, [doc])
  const paused = await q(`select * from get_availability($1, 30)`, [doc])
  check("paused doctor has no availability", paused.length === 0)
  await asPatient(PATIENT_1)
  await expectError("booking a paused doctor is rejected", `select * from book_appointment($1, $2, 'Pause Test', '5553330001')`, [slot.schedule_id, day], "NOT_ACCEPTING")
  await db.exec(`set request.jwt.claim.sub = ''`)
  await q(`update doctors set accepting_appointments = true where id = $1`, [doc])
  const offDay = (await q(`select * from get_doctor_roster(clinic_today(), 7) where doctor_id = $1 and status = 'off' limit 1`, [doc]))[0]
  check("roster marks non-working days as off", Boolean(offDay))
}

// RLS: anon cannot read appointments or inactive doctors.
await db.exec(`set role anon`)
const anonAppts = await q(`select count(*)::int c from appointments`)
check("anon cannot read appointments", anonAppts[0].c === 0)
await db.exec(`reset role`)
await q(`update doctors set is_active=false where slug='aisha-rahman'`)
await db.exec(`set role anon`)
const anonDocs = await q(`select count(*)::int c from doctors`)
check("anon sees only active doctors", anonDocs[0].c === 5)
await expectError("anon cannot insert appointments directly", `insert into appointments (reference, doctor_id, schedule_id, appointment_date, serial_no, patient_name, patient_phone) values ('X', $1, $2, $3, 99, 'Hack', '5550001111')`, [doctor, sid, day], "row-level security|AUTH_REQUIRED")
const upd = await q(`update doctors set full_name='Hacked' where true returning id`)
check("anon update affects zero rows", upd.length === 0)
await db.exec(`reset role`)
const hacked = await q(`select count(*)::int c from doctors where full_name='Hacked'`)
check("doctor rows unchanged by anon", hacked[0].c === 0)

// Admin via auth.uid()
await q(`insert into auth.users values ('00000000-0000-0000-0000-000000000001','admin@x.com')`)
await q(`insert into admins values ('00000000-0000-0000-0000-000000000001')`)
await db.exec(`set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'`)
const adminAppts = await q(`select count(*)::int c from appointments`)
check("admin reads appointments", adminAppts[0].c >= 5, `${adminAppts[0].c}`)
const adminDocs = await q(`select count(*)::int c from doctors`)
check("admin sees inactive doctors", adminDocs[0].c === 6)
await db.exec(`set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'`)
const nonAdmin = await q(`select count(*)::int c from appointments`)
check("non-admin user cannot read appointments", nonAdmin[0].c === 0)
await db.exec(`reset role`)

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED")
process.exit(failures ? 1 : 0)
