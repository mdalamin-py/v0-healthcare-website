import { clinicLocalToIso } from "@/lib/clinic/time"
import { site } from "@/lib/site"

export type CalendarAppointment = {
  reference: string
  appointment_date: string
  start_time: string
  end_time: string
  doctor_name: string
  specialty: string
  serial_no: number
  visitLabel: string
}

const toIcsDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "")

const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")

/** Builds an RFC 5545 calendar file for an appointment session. */
export function buildAppointmentIcs(appointment: CalendarAppointment) {
  const start = clinicLocalToIso(`${appointment.appointment_date}T${appointment.start_time.slice(0, 5)}`)
  const end = clinicLocalToIso(`${appointment.appointment_date}T${appointment.end_time.slice(0, 5)}`)
  const location = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`
  const description = [
    `Serial number: ${appointment.serial_no}`,
    `Reference: ${appointment.reference}`,
    `Visit type: ${appointment.visitLabel}`,
    `Questions? Call ${site.phone.display}`,
  ].join("\n")

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Appointments//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appointment.reference}@${new URL(site.url).hostname}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(`${appointment.doctor_name} (${appointment.specialty})`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
