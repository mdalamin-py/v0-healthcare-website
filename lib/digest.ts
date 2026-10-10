import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendSerialDigest, type DigestSession } from "@/lib/email"
import { clinicToday } from "@/lib/clinic/time"
import type { Database, DoctorContact, VisitType } from "@/lib/supabase/types"

type Client = SupabaseClient<Database>

export type DigestResult = {
  doctor: string
  appointments: number
  recipients: string[]
  status: "sent" | "skipped" | "failed"
  reason?: string
}

type Row = {
  doctor_id: string
  serial_no: number
  status: string
  patient_name: string
  patient_phone: string
  patient_age: number | null
  patient_address: string | null
  visit_type: VisitType | null
  reason: string | null
  doctor: { full_name: string } | null
  schedule: { start_time: string; end_time: string } | null
}

/**
 * Emails each doctor (and their assistant) the serial list for a day.
 * Idempotent: each doctor/day is claimed in the log before sending, so
 * concurrent runs (cron + manual button) never email twice.
 */
export async function sendDailySerialDigests(client: Client, date = clinicToday()): Promise<DigestResult[]> {
  const [{ data: appointments, error }, { data: contacts }, { data: log }] = await Promise.all([
    client
      .from("appointments")
      .select("doctor_id, serial_no, status, patient_name, patient_phone, patient_age, patient_address, visit_type, reason, doctor:doctors(full_name), schedule:doctor_schedules(start_time, end_time)")
      .eq("appointment_date", date)
      .neq("status", "cancelled")
      .order("serial_no"),
    client.from("doctor_contacts").select("*"),
    client.from("serial_digest_log").select("doctor_id").eq("digest_date", date),
  ])
  if (error) throw new Error(`Failed to load appointments: ${error.message}`)

  const sent = new Set((log ?? []).map((entry) => entry.doctor_id))
  const contactOf = new Map(((contacts ?? []) as DoctorContact[]).map((contact) => [contact.doctor_id, contact]))
  const byDoctor = new Map<string, Row[]>()
  for (const row of (appointments ?? []) as unknown as Row[]) {
    byDoctor.set(row.doctor_id, [...(byDoctor.get(row.doctor_id) ?? []), row])
  }

  const results: DigestResult[] = []
  for (const [doctorId, rows] of byDoctor) {
    const doctor = rows[0].doctor?.full_name ?? "Doctor"
    const contact = contactOf.get(doctorId)
    const recipients = [contact?.email, contact?.assistant_email].filter((value): value is string => Boolean(value))

    if (sent.has(doctorId)) {
      results.push({ doctor, appointments: rows.length, recipients, status: "skipped", reason: "Already sent today" })
      continue
    }
    if (recipients.length === 0) {
      results.push({ doctor, appointments: rows.length, recipients, status: "skipped", reason: "No email on file" })
      continue
    }

    const sessions = new Map<string, DigestSession>()
    for (const row of rows) {
      const key = row.schedule ? `${row.schedule.start_time}-${row.schedule.end_time}` : "unscheduled"
      const session = sessions.get(key) ?? { start_time: row.schedule?.start_time ?? "", end_time: row.schedule?.end_time ?? "", patients: [] }
      session.patients.push({
        serial: row.serial_no,
        name: row.patient_name,
        phone: row.patient_phone,
        age: row.patient_age,
        visitType: row.visit_type ?? "in_clinic",
        reason: row.reason,
        address: row.visit_type === "home_visit" ? row.patient_address : null,
        status: row.status,
      })
      sessions.set(key, session)
    }

    const { error: claimError } = await client
      .from("serial_digest_log")
      .insert({ doctor_id: doctorId, digest_date: date, recipients, appointment_count: rows.length })
    if (claimError) {
      const duplicate = claimError.code === "23505"
      results.push({ doctor, appointments: rows.length, recipients, status: duplicate ? "skipped" : "failed", reason: duplicate ? "Already sent today" : "Could not record the send" })
      continue
    }

    try {
      await sendSerialDigest({
        to: recipients,
        doctor,
        assistant: contact?.assistant_name ?? null,
        date,
        sessions: Array.from(sessions.values()).sort((a, b) => a.start_time.localeCompare(b.start_time)),
      })
      results.push({ doctor, appointments: rows.length, recipients, status: "sent" })
    } catch (cause) {
      console.error(`[digest] ${doctor}:`, cause)
      // Release the claim so a later run can retry.
      await client.from("serial_digest_log").delete().eq("doctor_id", doctorId).eq("digest_date", date)
      results.push({ doctor, appointments: rows.length, recipients, status: "failed", reason: "Email provider error" })
    }
  }
  return results
}
