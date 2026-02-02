import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingCallButton } from '@/components/floating-call-button'

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const merriweather = Merriweather({ 
  subsets: ["latin"], 
  weight: ['400', '700'],
  variable: '--font-merriweather' 
});

export const metadata: Metadata = {
  title: 'Dignity Home Health Care | Compassionate Home Care in Fresno, CA',
  description: 'Dignity Home Health Care provides professional, compassionate home health services in Fresno, CA. Skilled nursing, personal care, therapy services, and more. Call (559) 375-1234 today.',
  keywords: 'home health care, Fresno, CA, skilled nursing, personal care, therapy, elderly care, home care services',
  openGraph: {
    title: 'Dignity Home Health Care | Compassionate Home Care in Fresno, CA',
    description: 'Professional, compassionate home health services in Fresno, CA. Skilled nursing, personal care, and therapy services.',
    type: 'website',
    locale: 'en_US',
  },
  robots: 'index, follow',
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: '#0891b2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingCallButton />
        <Analytics />
      </body>
    </html>
  )
}
