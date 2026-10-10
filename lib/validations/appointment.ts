import { z } from "zod"
import { visitTypeValues } from "@/lib/clinic/visit-types"

const phone = z
  .string({ required_error: "Phone number is required" })
  .trim()
  .min(1, "Phone number is required")
  .max(25, "Phone number is too long")
  .refine((value) => {
    const digits = value.replace(/\D/g, "")
    return /^[\d\s()+.-]+$/.test(value) && digits.length >= 10 && digits.length <= 15
  }, "Please enter a valid phone number")

export const patientSchema = z.object({
  name: z.string().trim().min(2, "Please enter the patient's full name").max(100, "Name is too long"),
  phone,
  email: z.union([z.string().trim().email("Please enter a valid email address").max(254), z.literal("")]).optional(),
  age: z
    .union([
      z.literal(""),
      z.coerce.number().int("Age must be a whole number").min(0, "Please enter a valid age").max(130, "Please enter a valid age"),
    ])
    .optional(),
  gender: z.enum(["female", "male", "other", ""]).optional(),
  reason: z.string().trim().max(1000, "Please keep this under 1000 characters").optional(),
  address: z.string().trim().max(300, "Address is too long").optional(),
  consent: z.boolean().refine((value) => value, "Please confirm to continue"),
})

export const bookingSchema = patientSchema
  .extend({
    scheduleId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    visitType: z.enum(visitTypeValues),
  })
  .refine((value) => value.visitType !== "home_visit" || (value.address?.length ?? 0) >= 5, {
    message: "Please enter the address for the home visit",
    path: ["address"],
  })

export const lookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^DHC-[0-9A-F]{8}$/, "Enter the reference from your confirmation, e.g. DHC-1A2B3C4D"),
  phone,
})

export type PatientInput = z.input<typeof patientSchema>
export type BookingInput = z.input<typeof bookingSchema>
export type LookupInput = z.input<typeof lookupSchema>
