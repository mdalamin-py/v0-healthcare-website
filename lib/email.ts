import "server-only"
import { patientRelations, type ContactInput } from "@/lib/validations/contact"
import { site } from "@/lib/site"

const RESEND_ENDPOINT = "https://api.resend.com/emails"

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
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

  const html = `
    <h2>New consultation request</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(([label, value]) => `<tr><td><strong>${label}</strong></td><td>${escapeHtml(value)}</td></tr>`)
        .join("")}
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
  `

  const text = [...rows.map(([label, value]) => `${label}: ${value}`), "", "Message:", data.message].join("\n")

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? `${site.name} <onboarding@resend.dev>`,
      to: process.env.CONTACT_TO_EMAIL!.split(",").map((address) => address.trim()),
      reply_to: data.email,
      subject: `New consultation request from ${data.firstName} ${data.lastName}`,
      html,
      text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Email provider responded with ${response.status}`)
  }
}
