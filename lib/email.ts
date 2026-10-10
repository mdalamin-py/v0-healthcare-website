import "server-only"
import { buildAppointmentIcs, type CalendarAppointment } from "@/lib/clinic/ics"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
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

export async function sendBookingConfirmation(to: string, booking: CalendarAppointment & { instructions: string }) {
  const date = formatDate(booking.appointment_date, { weekday: "long", year: "numeric" })
  const session = formatTimeRange(booking.start_time, booking.end_time)
  const rows: Array<[string, string]> = [
    ["Reference", booking.reference],
    ["Doctor", `${booking.doctor_name} · ${booking.specialty}`],
    ["Date", date],
    ["Session", session],
    ["Visit type", booking.visitLabel],
  ]

  const html = layout(
    "Your appointment is booked",
    `<p style="font-size:14px;margin:0 0 16px">Thank you for booking with us. Here are your appointment details.</p>
    <div style="text-align:center;background:#f0fdfa;border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#0f766e">Your serial number</div>
      <div style="font-size:40px;font-weight:bold;color:#0d9488">${booking.serial_no}</div>
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
