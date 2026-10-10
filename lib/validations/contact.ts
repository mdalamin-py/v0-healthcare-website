import { z } from "zod"
import { serviceNames } from "@/lib/site"

export const patientRelations = [
  { value: "self", label: "I am the patient" },
  { value: "spouse", label: "Spouse / Partner" },
  { value: "child", label: "Son / Daughter" },
  { value: "parent", label: "Parent" },
  { value: "other-family", label: "Other family member" },
  { value: "friend", label: "Friend" },
  { value: "healthcare-provider", label: "Healthcare provider" },
  { value: "other", label: "Other" },
] as const

export const contactServices = [...serviceNames, "Other"] as const

const relationValues = patientRelations.map((relation) => relation.value) as [string, ...string[]]

const requiredText = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)

export const contactSchema = z.object({
  firstName: requiredText("First name", 50),
  lastName: requiredText("Last name", 50),
  email: requiredText("Email", 254).email("Please enter a valid email address"),
  phone: requiredText("Phone number", 25).refine((value) => {
    const digits = value.replace(/\D/g, "")
    return /^[\d\s()+.-]+$/.test(value) && digits.length >= 10 && digits.length <= 15
  }, "Please enter a valid phone number"),
  patientRelation: z.union([z.enum(relationValues), z.literal("")]).optional(),
  service: z.union([z.enum(contactServices), z.literal("")]).optional(),
  message: requiredText("Message", 2000).min(10, "Please share a few more details (at least 10 characters)"),
  // Honeypot: real users never see or fill this field.
  company: z.string().max(0).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
