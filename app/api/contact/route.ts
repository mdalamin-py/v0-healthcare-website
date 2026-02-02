import { NextRequest, NextResponse } from "next/server"

// In-memory store for demo (in production, use a database)
const contacts: Array<{
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  service: string
  message: string
  patientRelation: string
  createdAt: string
}> = []

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "unknown"
  return ip
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(key)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return false
  }

  if (limit.count >= 5) { // 5 requests per minute
    return true
  }

  limit.count++
  return false
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  return /^[\d\s\-()+ ]{10,}$/.test(phone.replace(/\s/g, ""))
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .slice(0, 1000) // Limit length
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const { firstName, lastName, email, phone, message, service, patientRelation } = body

    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      )
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return NextResponse.json(
        { error: "Please provide a valid phone number." },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      id: crypto.randomUUID(),
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      email: sanitizeInput(email),
      phone: sanitizeInput(phone),
      service: sanitizeInput(service || ""),
      message: sanitizeInput(message),
      patientRelation: sanitizeInput(patientRelation || ""),
      createdAt: new Date().toISOString(),
    }

    // Store contact (in production, save to database)
    contacts.push(sanitizedData)

    // Log for demo purposes
    console.log("New contact submission:", {
      name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      service: sanitizedData.service,
      createdAt: sanitizedData.createdAt,
    })

    // In production, you would:
    // 1. Save to MongoDB/database
    // 2. Send email notification via Nodemailer
    // 3. Potentially integrate with CRM

    return NextResponse.json(
      { 
        success: true, 
        message: "Thank you for contacting us. We will get back to you within 24 hours." 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again or call us directly." },
      { status: 500 }
    )
  }
}

// GET endpoint for admin to view contacts (protected in production)
export async function GET() {
  // In production, this should be protected with authentication
  return NextResponse.json({ contacts, total: contacts.length })
}
