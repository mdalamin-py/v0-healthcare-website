import { z } from "zod"
import { visitTypeValues } from "@/lib/clinic/visit-types"
import { dutyTypeValues } from "@/lib/clinic/duty"
import { ambulanceStatusValues, ambulanceTypeValues } from "@/lib/clinic/ambulance"

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)

export const doctorSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only")
    .max(80),
  specialty: z.string().trim().min(2, "Specialty is required").max(100),
  qualification: optionalText(200),
  experience_years: z.coerce.number().int().min(0).max(80),
  bio: optionalText(2000),
  photo_url: z
    .string()
    .trim()
    .refine((value) => !value || value.startsWith("https://"), "Photo URL must start with https://")
    .transform((value) => value || null),
  consultation_fee: z
    .string()
    .trim()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Enter a valid amount")
    .transform((value) => (value ? Number(value) : null)),
  languages: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((items) => items.length > 0, "Add at least one language"),
  room: optionalText(50),
  visit_types: z.array(z.enum(visitTypeValues)).min(1, "Select at least one visit type"),
  accepting_appointments: z.boolean(),
  kind: z.enum(["consultant", "intern"]),
  is_active: z.boolean(),
})

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email")
  .transform((value) => value || null)

export const contactSchema = z.object({
  email: optionalEmail,
  assistant_name: optionalText(100),
  assistant_email: optionalEmail,
})

export const ambulanceSchema = z.object({
  code: z.string().trim().toUpperCase().min(2, "Enter a code").max(20),
  vehicle_model: z.string().trim().min(2, "Enter the vehicle model").max(80),
  registration: z.string().trim().toUpperCase().min(2, "Enter the registration").max(20),
  type: z.enum(ambulanceTypeValues),
  status: z.enum(ambulanceStatusValues),
  equipment: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  base_location: optionalText(120),
  driver_name: optionalText(100),
})

export const leaveSchema = z.object({
  doctor_id: z.string().uuid(),
  leave_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  reason: optionalText(120),
})

export const scheduleSchema = z
  .object({
    doctor_id: z.string().uuid(),
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time"),
    max_patients: z.coerce.number().int().min(1).max(200),
  })
  .refine((value) => value.end_time > value.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  })

export const onCallSchema = z
  .object({
    doctor_id: z.string().uuid("Choose a doctor"),
    duty_type: z.enum(dutyTypeValues),
    starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a start time"),
    ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose an end time"),
    note: optionalText(200),
  })
  .refine((value) => value.ends_at > value.starts_at, { message: "End must be after start", path: ["ends_at"] })

export const appointmentStatuses = ["pending", "confirmed", "completed", "cancelled"] as const
