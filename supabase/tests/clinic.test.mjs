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
check("seed loaded", counts[0].d === 9 && counts[0].s === 16 && counts[0].o === 70, JSON.stringify(counts[0]))

const onCallNow = await q(`select d.full_name from on_call_shifts o join doctors d on d.id=o.doctor_id where o.duty_type = 'on_call' and now() between o.starts_at and o.ends_at`)
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

// Duty roster
{
  const interns = await q(`select count(*)::int c from doctors where kind = 'intern'`)
  check("interns seeded", interns[0].c === 3)
  const emergencyNow = await q(`select count(*)::int c from on_call_shifts where duty_type = 'emergency' and now() between starts_at and ends_at`)
  const wardNow = await q(`select count(*)::int c from on_call_shifts where duty_type = 'ward' and now() between starts_at and ends_at`)
  check("intern duty covers the clock with at most one shift per slot", emergencyNow[0].c + wardNow[0].c === 1, `${emergencyNow[0].c}+${wardNow[0].c}`)
  const intern = (await q(`select id from doctors where kind = 'intern' limit 1`))[0].id
  const schedule = (await q(`insert into doctor_schedules (doctor_id, weekday, start_time, end_time) values ($1, extract(dow from clinic_today() + 1)::int, '09:00', '12:00') returning id`, [intern]))[0].id
  await asPatient(PATIENT_1)
  await expectError("interns cannot be booked", `select * from book_appointment($1, (clinic_today() + 1)::date, 'Intern Test', '5553339999')`, [schedule], "NOT_ACCEPTING")
  await db.exec(`set request.jwt.claim.sub = ''`)
  await q(`delete from doctor_schedules where id = $1`, [schedule])
}

// Doctor contacts are private
{
  await db.exec(`set role anon`)
  const contacts = await q(`select count(*)::int c from doctor_contacts`)
  await db.exec(`reset role`)
  const all = await q(`select count(*)::int c from doctor_contacts`)
  check("doctor contact emails are hidden from the public", contacts[0].c === 0 && all[0].c === 6, `${contacts[0].c}/${all[0].c}`)
}

// Ambulances
{
  const fleet = await q(`select count(*)::int c, count(*) filter (where status = 'available')::int a from ambulances`)
  check("ambulance fleet seeded", fleet[0].c === 5 && fleet[0].a === 3, JSON.stringify(fleet[0]))
  const requestId = (await q(`select request_ambulance('Ana Ruiz', '559-777-1000', '12 Elm St, Fresno', 'Dialysis transport') id`))[0].id
  const again = (await q(`select request_ambulance('Ana Ruiz', '5597771000', '12 Elm St, Fresno') id`))[0].id
  check("duplicate pending ambulance request is merged", requestId === again)
  await expectError("invalid ambulance request rejected", `select request_ambulance('A', '1', 'x')`, [], "INVALID_REQUEST")
  const amb = (await q(`select id from ambulances where code = 'AMB-02'`))[0].id
  const busy = (await q(`select id from ambulances where code = 'AMB-03'`))[0].id
  await asPatient(PATIENT_2)
  await expectError("only admins can dispatch", `select dispatch_ambulance($1, $2)`, [requestId, amb], "FORBIDDEN")
  await q(`insert into admins values ($1) on conflict do nothing`, [PATIENT_1])
  await asPatient(PATIENT_1)
  await expectError("busy ambulance cannot be dispatched", `select dispatch_ambulance($1, $2)`, [requestId, busy], "AMBULANCE_UNAVAILABLE")
  await q(`select dispatch_ambulance($1, $2)`, [requestId, amb])
  const onTrip = (await q(`select status from ambulances where id = $1`, [amb]))[0].status
  check("dispatched ambulance goes on trip", onTrip === "on_trip")
  await q(`select close_ambulance_request($1, 'completed')`, [requestId])
  const back = (await q(`select status from ambulances where id = $1`, [amb]))[0].status
  check("completing the request frees the ambulance", back === "available")
  await expectError("closed request cannot be closed again", `select close_ambulance_request($1, 'cancelled')`, [requestId], "REQUEST_CLOSED")
  await q(`delete from admins where user_id = $1`, [PATIENT_1])
  await db.exec(`set request.jwt.claim.sub = ''`)
  await db.exec(`set role anon`)
  const anonRequests = await q(`select count(*)::int c from ambulance_requests`)
  const anonFleet = await q(`select count(*)::int c from ambulances`)
  await db.exec(`reset role`)
  check("requests are private, fleet is public", anonRequests[0].c === 0 && anonFleet[0].c === 5)
}

// Nearby facilities
{
  const seeded = await q(`select count(*)::int c, count(*) filter (where has_emergency)::int er from nearby_facilities`)
  check("nearby facilities seeded", seeded[0].c === 8 && seeded[0].er === 4, JSON.stringify(seeded[0]))
  await q(`update nearby_facilities set is_active = false where name = 'Accelerated Urgent Care'`)
  await expectError("facility website must use https", `update nearby_facilities set website = 'http://x.com' where name = 'Everyday Healthcare'`, [], "check constraint")
  await db.exec(`set role anon`)
  const visible = await q(`select count(*)::int c from nearby_facilities`)
  const write = await q(`update nearby_facilities set name = 'Hacked' where true returning id`)
  await db.exec(`reset role`)
  check("public sees only active facilities", visible[0].c === 7, `${visible[0].c}`)
  check("public cannot edit facilities", write.length === 0)
  await q(`update nearby_facilities set is_active = true`)
}

// Operation theatres
{
  const theatres = await q(`select count(*)::int c from operation_theatres`)
  const cases = await q(`select count(*)::int c, min(case_code) first from surgeries`)
  check("theatres and today's cases seeded", theatres[0].c === 3 && cases[0].c === 5 && cases[0].first === "S-1001", JSON.stringify(cases[0]))
  await db.exec(`set role anon`)
  const board = await q(`select * from get_ot_board()`)
  const hidden = await q(`select count(*)::int c from surgeries`)
  await db.exec(`reset role`)
  check("public board lists today's cases", board.length === 5, `${board.length}`)
  check("public board hides patient details", !("patient_name" in board[0]) && hidden[0].c === 0)

  const hernia = (await q(`select id, theatre_id from surgeries where procedure = 'Hernia repair'`))[0]
  await q(`update surgeries set status = 'in_progress' where id = $1`, [hernia.id])
  const live = (await q(`select s.started_at, t.status from surgeries s join operation_theatres t on t.id = s.theatre_id where s.id = $1`, [hernia.id]))[0]
  check("starting a case stamps the time and occupies the theatre", live.started_at !== null && live.status === "in_use", live.status)
  await expectError(
    "a theatre cannot run two cases at once",
    `update surgeries set status = 'in_progress' where procedure = 'Hip fracture fixation'`,
    [],
    "surgeries_one_active_per_theatre",
  )
  await q(`update surgeries set status = 'recovery' where id = $1`, [hernia.id])
  const done = (await q(`select s.ended_at, t.status from surgeries s join operation_theatres t on t.id = s.theatre_id where s.id = $1`, [hernia.id]))[0]
  check("finishing a case frees the theatre for cleaning", done.ended_at !== null && done.status === "cleaning", done.status)
}

// Integrity and privacy fixes
{
  await db.exec(`reset role; set request.jwt.claim.sub = ''`)
  // Reviews: the public view never exposes patient or appointment ids.
  await db.exec(`set role anon`)
  const rawReviews = await q(`select count(*)::int c from doctor_reviews`)
  const publicReview = await q(`select * from published_reviews limit 1`)
  await db.exec(`reset role`)
  const approved = await q(`select count(*)::int c from doctor_reviews where status = 'approved'`)
  check("anon cannot read the raw reviews table", rawReviews[0].c === 0)
  check(
    "published reviews hide patient ids",
    approved[0].c === 0 || (publicReview.length === 1 && !("patient_id" in publicReview[0]) && !("appointment_id" in publicReview[0])),
  )

  // Interns are never bookable, even with sessions and accepting switched on.
  const intern = (await q(`select id from doctors where slug = 'aiden-brooks'`))[0].id
  await q(`update doctors set accepting_appointments = true where id = $1`, [intern])
  await q(`insert into doctor_schedules (doctor_id, weekday, start_time, end_time) select $1, g, '09:00', '12:00' from generate_series(0, 6) g`, [intern])
  const internSlots = await q(`select * from get_availability($1, 14)`, [intern])
  check("interns have no bookable sessions", internSlots.length === 0, `${internSlots.length}`)

  // Retired sessions disappear from availability and reject bookings.
  const ramirez = (await q(`select id from doctors where slug = 'michael-patel'`))[0].id
  const slot = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() limit 1`, [ramirez]))[0]
  await q(`update doctor_schedules set is_active = false where id = $1`, [slot.schedule_id])
  const stillListed = await q(`select 1 from get_availability($1, 30) where schedule_id = $2`, [ramirez, slot.schedule_id])
  check("retired session is not offered", stillListed.length === 0)
  await asPatient(PATIENT_2)
  await expectError(
    "booking a retired session is rejected",
    `select * from book_appointment($1, $2, 'Late Booker', '5550002222')`,
    [slot.schedule_id, slot.appointment_date.toISOString().slice(0, 10)],
    "SESSION_NOT_FOUND",
  )
  await db.exec(`set request.jwt.claim.sub = ''`)
  await q(`update doctor_schedules set is_active = true where id = $1`, [slot.schedule_id])

  // Doctors on leave today drop out of the live queue.
  const queueDoctor = (await q(`select doctor_id from get_today_queue() limit 1`))[0]?.doctor_id
  if (queueDoctor) {
    await q(`insert into doctor_leaves (doctor_id, leave_date, reason) values ($1, clinic_today(), 'Sick')`, [queueDoctor])
    const queued = await q(`select 1 from get_today_queue() where doctor_id = $1`, [queueDoctor])
    check("doctor on leave is hidden from today's queue", queued.length === 0)
    await q(`delete from doctor_leaves where doctor_id = $1 and leave_date = clinic_today()`, [queueDoctor])
  }

  // An ambulance on an open trip cannot be released by hand.
  await expectError(
    "ambulance on an open trip cannot be marked available",
    `update ambulances set status = 'available' where code = 'AMB-03'`,
    [],
    "AMBULANCE_ON_TRIP",
  )

  // Service jobs may insert appointments without a patient session.
  await db.exec(`set request.jwt.claim.role = 'service_role'`)
  const svcSlot = (await q(`select * from get_availability($1, 30) where appointment_date > clinic_today() limit 1`, [ramirez]))[0]
  const svc = await q(
    `insert into appointments (reference, doctor_id, schedule_id, appointment_date, serial_no, patient_name, patient_phone)
     values ('DHC-5E7C1CE0', $1, $2, $3, 990, 'Staff Booking', '5550003333') returning patient_id`,
    [ramirez, svcSlot.schedule_id, svcSlot.appointment_date.toISOString().slice(0, 10)],
  )
  await db.exec(`set request.jwt.claim.role = ''`)
  check("service role can insert appointments", svc.length === 1 && svc[0].patient_id === null)
  await q(`delete from appointments where reference = 'DHC-5E7C1CE0'`)
}

// Public stats are live counts, readable without signing in
{
  await db.exec(`reset role; set request.jwt.claim.sub = ''; set role anon`)
  const stats = (await q(`select * from get_public_stats()`))[0]
  const view = await q(`select doctor_name, doctor_specialty from published_reviews limit 1`)
  await db.exec(`reset role`)
  const expected = (await q(`select count(*)::int c from doctors where is_active and kind = 'consultant'`))[0].c
  check("public stats count active consultants", stats.doctors === expected, `${stats.doctors}/${expected}`)
  check("public stats count available ambulances", stats.ambulances_ready === 3, `${stats.ambulances_ready}`)
  check("published reviews include the doctor", view.length === 0 || Boolean(view[0].doctor_name))
}

// RLS: anon cannot read appointments or inactive doctors.
await db.exec(`set role anon`)
const anonAppts = await q(`select count(*)::int c from appointments`)
check("anon cannot read appointments", anonAppts[0].c === 0)
await db.exec(`reset role`)
await q(`update doctors set is_active=false where slug='aisha-rahman'`)
await db.exec(`set role anon`)
const anonDocs = await q(`select count(*)::int c from doctors`)
check("anon sees only active doctors", anonDocs[0].c === 8)
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
check("admin sees inactive doctors", adminDocs[0].c === 9)
await db.exec(`set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'`)
const nonAdmin = await q(`select count(*)::int c from appointments`)
check("non-admin user cannot read appointments", nonAdmin[0].c === 0)
await db.exec(`reset role`)

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED")
process.exit(failures ? 1 : 0)
