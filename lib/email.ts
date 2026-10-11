import "server-only"
import { buildAppointmentIcs, type CalendarAppointment } from "@/lib/clinic/ics"
import { formatDate, formatTime, formatTimeRange } from "@/lib/clinic/format"
import { visitTypeMeta } from "@/lib/clinic/visit-types"
import type { VisitType } from "@/lib/supabase/types"
import { patientRelations, type ContactInput } from "@/lib/validations/contact"
import { site } from "@/lib/site"

const RESEND_ENDPOINT = "https://api.resend.com/emails"

type Email = {
  to: string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: { filename: string; content: string; content_type?: string }[]
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export function isEmailConfigured() {
  return isResendConfigured() && Boolean(process.env.CONTACT_TO_EMAIL)
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

async function sendEmail(email: Email) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? `${site.name} <onboarding@resend.dev>`,
      to: email.to,
      reply_to: email.replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments,
    }),
  })

  if (!response.ok) {
    throw new Error(`Email provider responded with ${response.status}`)
  }
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:linear-gradient(135deg,#0d9488,#10b981);padding:24px 28px;color:#ffffff">
      <div style="font-size:14px;opacity:.85">${escapeHtml(site.name)}</div>
      <div style="font-size:22px;font-weight:bold;margin-top:4px">${escapeHtml(title)}</div>
    </td></tr>
    <tr><td style="padding:24px 28px">${body}</td></tr>
    <tr><td style="padding:16px 28px;background:#f8fafc;font-size:12px;color:#64748b">
      ${escapeHtml(site.address.street)}, ${escapeHtml(site.address.city)}, ${site.address.region} · ${escapeHtml(site.phone.display)}
    </td></tr>
  </table></td></tr></table></body></html>`
}

export async function sendContactEmail(data: ContactInput) {
  const relation = patientRelations.find((item) => item.value === data.patientRelation)?.label
  const rows: Array<[string, string]> = [
    ["Name", `${data.firstName} ${data.lastName}`],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Relationship", relation ?? "Not specified"],
    ["Service", data.service || "Not specified"],
  ]

  const html = layout(
    "New consultation request",
    `<table cellpadding="6" style="border-collapse:collapse;font-size:14px">
      ${rows.map(([label, value]) => `<tr><td style="color:#64748b">${label}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`).join("")}
    </table>
    <p style="margin-top:16px;font-size:14px;white-space:pre-wrap">${escapeHtml(data.message)}</p>`,
  )
  const text = [...rows.map(([label, value]) => `${label}: ${value}`), "", "Message:", data.message].join("\n")

  await sendEmail({
    to: process.env.CONTACT_TO_EMAIL!.split(",").map((address) => address.trim()),
    replyTo: data.email,
    subject: `New consultation request from ${data.firstName} ${data.lastName}`,
    html,
    text,
  })
}

export type DigestSession = {
  start_time: string
  end_time: string
  patients: {
    serial: number
    time: string | null
    name: string
    phone: string
    age: number | null
    visitType: VisitType
    reason: string | null
    address: string | null
    status: string
  }[]
}

export async function sendSerialDigest({
  to,
  doctor,
  assistant,
  date,
  sessions,
}: {
  to: string[]
  doctor: string
  assistant: string | null
  date: string
  sessions: DigestSession[]
}) {
  const total = sessions.reduce((sum, session) => sum + session.patients.length, 0)
  const day = formatDate(date, { weekday: "long", year: "numeric" })
  const blocks = sessions
    .map(
      (session) => `
      <h3 style="font-size:15px;margin:20px 0 8px">${session.start_time ? formatTimeRange(session.start_time, session.end_time) : "Session"} · ${session.patients.length} patients</h3>
      <table cellpadding="6" style="border-collapse:collapse;width:100%;font-size:13px">
        <tr style="background:#f1f5f9;text-align:left"><th>#</th><th>Time</th><th>Patient</th><th>Phone</th><th>Visit</th><th>Reason</th></tr>
        ${session.patients
          .map(
            (patient) => `<tr style="border-bottom:1px solid #e2e8f0">
              <td><strong>${patient.serial}</strong></td>
              <td>${patient.time ? formatTime(patient.time) : ""}</td>
              <td>${escapeHtml(patient.name)}${patient.age != null ? ` (${patient.age})` : ""}</td>
              <td>${escapeHtml(patient.phone)}</td>
              <td>${escapeHtml(visitTypeMeta(patient.visitType).label)}</td>
              <td>${escapeHtml(patient.reason ?? "")}${patient.address ? `<br><small>Home visit: ${escapeHtml(patient.address)}</small>` : ""}</td>
            </tr>`,
          )
          .join("")}
      </table>`,
    )
    .join("")

  const html = layout(
    `Today's serial list · ${total} patients`,
    `<p style="font-size:14px;margin:0">Good morning ${escapeHtml(doctor)}${assistant ? ` and ${escapeHtml(assistant)}` : ""},</p>
    <p style="font-size:14px">Here is the serial list for <strong>${escapeHtml(day)}</strong>.</p>
    ${blocks}
    <p style="margin-top:20px"><a href="${site.url}/admin/queue" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px">Open the live queue</a></p>`,
  )
  const text = [
    `Serial list for ${day} (${doctor})`,
    ...sessions.flatMap((session) => [
      "",
      session.start_time ? formatTimeRange(session.start_time, session.end_time) : "Session",
      ...session.patients.map(
        (patient) => `#${patient.serial}${patient.time ? ` ${formatTime(patient.time)}` : ""} ${patient.name} · ${patient.phone} · ${visitTypeMeta(patient.visitType).label}${patient.reason ? ` · ${patient.reason}` : ""}${patient.address ? ` · ${patient.address}` : ""}`,
      ),
    ]),
  ].join("\n")

  await sendEmail({ to, subject: `Serial list · ${day} · ${total} patients`, html, text })
}

export async function sendAmbulanceAlert(request: { name: string; phone: string; address: string; details?: string }) {
  const html = layout(
    "Ambulance requested",
    `<table cellpadding="6" style="font-size:14px">
      <tr><td style="color:#64748b">Name</td><td><strong>${escapeHtml(request.name)}</strong></td></tr>
      <tr><td style="color:#64748b">Phone</td><td><strong>${escapeHtml(request.phone)}</strong></td></tr>
      <tr><td style="color:#64748b">Pickup</td><td><strong>${escapeHtml(request.address)}</strong></td></tr>
    </table>
    ${request.details ? `<p style="font-size:14px;white-space:pre-wrap">${escapeHtml(request.details)}</p>` : ""}
    <p><a href="${site.url}/admin/ambulances">Dispatch from the dashboard</a></p>`,
  )
  await sendEmail({
    to: process.env.CONTACT_TO_EMAIL!.split(",").map((address) => address.trim()),
    subject: `Ambulance request: ${request.name} · ${request.phone}`,
    html,
    text: `Ambulance requested\nName: ${request.name}\nPhone: ${request.phone}\nPickup: ${request.address}\n\n${request.details ?? ""}`,
  })
}

export async function sendCallbackAlert(request: { name: string; phone: string; concern: string }) {
  const html = layout(
    "Urgent callback requested",
    `<p style="font-size:14px">A patient asked for an urgent callback from the emergency page.</p>
    <table cellpadding="6" style="font-size:14px">
      <tr><td style="color:#64748b">Name</td><td><strong>${escapeHtml(request.name)}</strong></td></tr>
      <tr><td style="color:#64748b">Phone</td><td><strong>${escapeHtml(request.phone)}</strong></td></tr>
    </table>
    <p style="font-size:14px;white-space:pre-wrap">${escapeHtml(request.concern)}</p>
    <p><a href="${site.url}/admin/callbacks">Open callbacks in the dashboard</a></p>`,
  )
  await sendEmail({
    to: process.env.CONTACT_TO_EMAIL!.split(",").map((address) => address.trim()),
    subject: `Urgent callback: ${request.name} · ${request.phone}`,
    html,
    text: `Urgent callback requested\nName: ${request.name}\nPhone: ${request.phone}\n\n${request.concern}`,
  })
}

export async function sendDoctorApplicationAlert(application: { full_name: string; email: string; specialty: string; license_number: string }) {
  const html = layout(
    "New doctor registration",
    `<p style="font-size:14px">A doctor applied to join the clinic and is waiting for review.</p>
    <table cellpadding="6" style="font-size:14px">
      <tr><td style="color:#64748b">Name</td><td><strong>${escapeHtml(application.full_name)}</strong></td></tr>
      <tr><td style="color:#64748b">Specialty</td><td>${escapeHtml(application.specialty)}</td></tr>
      <tr><td style="color:#64748b">License</td><td>${escapeHtml(application.license_number)}</td></tr>
      <tr><td style="color:#64748b">Email</td><td>${escapeHtml(application.email)}</td></tr>
    </table>
    <p><a href="${site.url}/admin/doctors">Review it in the dashboard</a></p>`,
  )
  await sendEmail({
    to: process.env.CONTACT_TO_EMAIL!.split(",").map((address) => address.trim()),
    subject: `Doctor registration: ${application.full_name} · ${application.specialty}`,
    html,
    text: `New doctor registration\n${application.full_name} · ${application.specialty}\nLicense: ${application.license_number}\nEmail: ${application.email}`,
  })
}

export async function sendBookingConfirmation(to: string, booking: CalendarAppointment & { instructions: string }) {
  const date = formatDate(booking.appointment_date, { weekday: "long", year: "numeric" })
  const session = formatTimeRange(booking.start_time, booking.end_time)
  const arrival = booking.reporting_time ? formatTime(booking.reporting_time) : null
  const rows: Array<[string, string]> = [
    ["Reference", booking.reference],
    ["Doctor", `${booking.doctor_name} · ${booking.specialty}`],
    ["Date", date],
    ...(arrival ? [["Arrive by", arrival] as [string, string]] : []),
    ["Session", session],
    ["Visit type", booking.visitLabel],
  ]

  const html = layout(
    "Your appointment is booked",
    `<p style="font-size:14px;margin:0 0 16px">Thank you for booking with us. Here are your appointment details.</p>
    <div style="text-align:center;background:#f0fdfa;border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#0f766e">Your serial number</div>
      <div style="font-size:40px;font-weight:bold;color:#0d9488">${booking.serial_no}</div>
      ${arrival ? `<div style="font-size:14px;color:#0f766e">Please arrive by <strong>${arrival}</strong></div>` : ""}
    </div>
    <table cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%">
      ${rows.map(([label, value]) => `<tr><td style="color:#64748b">${label}</td><td align="right"><strong>${escapeHtml(value)}</strong></td></tr>`).join("")}
    </table>
    <p style="font-size:14px;margin:16px 0">${escapeHtml(booking.instructions)}</p>
    <p style="margin:0"><a href="${site.url}/account" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px">Manage my appointment</a></p>`,
  )
  const text = [
    "Your appointment is booked.",
    `Serial number: ${booking.serial_no}`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    booking.instructions,
    `Manage your appointment: ${site.url}/account`,
  ].join("\n")

  await sendEmail({
    to: [to],
    subject: `Appointment confirmed · ${date} · Serial #${booking.serial_no}`,
    html,
    text,
    attachments: [
      {
        filename: `appointment-${booking.reference}.ics`,
        content: Buffer.from(buildAppointmentIcs(booking)).toString("base64"),
        content_type: "text/calendar",
      },
    ],
  })
}
