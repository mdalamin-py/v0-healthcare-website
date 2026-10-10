import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_Bengali, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getLocale } from "@/lib/i18n/server"
import { site } from "@/lib/site"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali" })
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Compassionate Home Care in Fresno, CA`,
    template: `%s | ${site.name}`,
  },
  applicationName: site.name,
  description: `${site.name} provides professional, compassionate home health services in Fresno, CA. Skilled nursing, personal care, therapy services, and more. Call ${site.phone.display} today.`,
  keywords: "home health care, Fresno, CA, skilled nursing, personal care, therapy, elderly care, home care services",
  openGraph: {
    title: `${site.name} | Compassionate Home Care in Fresno, CA`,
    description: site.description,
    siteName: site.name,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} ${bengali.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
