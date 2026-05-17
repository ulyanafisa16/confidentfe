// src/app/layout.tsx

import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500'],
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'OneTimeUnlock — Share secrets that disappear',
  description: 'Send passwords, API keys, or confidential notes through a secure link.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}