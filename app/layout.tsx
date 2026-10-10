import type { Metadata, Viewport } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FloatingCallButton } from "@/components/floating-call-button"
import { ThemeProvider } from "@/components/theme-provider"
import { site } from "@/lib/site"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  title: `${site.name} | Compassionate Home Care in Fresno, CA`,
  description: `${site.name} provides professional, compassionate home health services in Fresno, CA. Skilled nursing, personal care, therapy services, and more. Call ${site.phone.display} today.`,
  keywords: "home health care, Fresno, CA, skilled nursing, personal care, therapy, elderly care, home care services",
  openGraph: {
    title: `${site.name} | Compassionate Home Care in Fresno, CA`,
    description: site.description,
    type: "website",
    locale: "en_US",
  },
  robots: "index, follow",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <FloatingCallButton />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
