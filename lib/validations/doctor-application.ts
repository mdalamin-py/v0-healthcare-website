import { z } from "zod"
import { phoneNumber } from "@/lib/validations/phone"

export const doctorApplicationSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(96, "Name is too long"),
  phone: phoneNumber,
  specialty: z.string().trim().min(2, "Enter your specialty").max(100),
  qualification: z.string().trim().min(2, "Enter your degrees and certifications").max(200),
  license_number: z.string().trim().min(3, "Enter your medical license number").max(50),
  experience_years: z.coerce.number({ invalid_type_error: "Enter years of experience" }).int().min(0).max(80),
  // A comma list from the form, or the array the client-side parse already produced.
  languages: z
    .union([z.string(), z.array(z.string())])
    .transform((value) =>
      (Array.isArray(value) ? value : value.split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((items) => items.length > 0, "Add at least one language"),
  bio: z.string().trim().max(2000, "Keep the bio under 2000 characters").optional(),
})

export type DoctorApplicationInput = z.input<typeof doctorApplicationSchema>
