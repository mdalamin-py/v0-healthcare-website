import { z } from "zod"

/** Normalizes a phone number to E.164. US numbers may omit the +1 prefix. */
export function toE164(value: string) {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, "")
  if (trimmed.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return null
}

export const otpChannels = ["email", "phone"] as const
export type OtpChannel = (typeof otpChannels)[number]

export const otpRequestSchema = z.discriminatedUnion("channel", [
  z.object({ channel: z.literal("email"), identifier: z.string().trim().toLowerCase().email("Enter a valid email address") }),
  z.object({
    channel: z.literal("phone"),
    identifier: z
      .string()
      .trim()
      .refine((value) => toE164(value) !== null, "Enter a valid mobile number, e.g. (559) 123-4567")
      .transform((value) => toE164(value)!),
  }),
])

export const otpVerifySchema = z.intersection(
  otpRequestSchema,
  z.object({ token: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }),
)

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "")
      return digits.length >= 10 && digits.length <= 15
    }, "Enter a valid phone number"),
  email: z.union([z.string().trim().toLowerCase().email("Enter a valid email address"), z.literal("")]),
  date_of_birth: z
    .string()
    .refine((value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value) <= new Date()), "Enter a valid date")
    .optional(),
  gender: z.enum(["female", "male", "other", ""]).optional(),
  address: z.string().trim().max(300).optional(),
})

export type ProfileInput = z.input<typeof profileSchema>
