import { z } from "zod"

/** Shared by the profile and booking forms so a saved number always books. */
export const phoneNumber = z
  .string({ required_error: "Phone number is required" })
  .trim()
  .min(1, "Phone number is required")
  .max(25, "Phone number is too long")
  .refine((value) => {
    const digits = value.replace(/\D/g, "")
    return /^[\d\s()+.-]+$/.test(value) && digits.length >= 10 && digits.length <= 15
  }, "Please enter a valid phone number, e.g. (559) 123-4567")
