import type { Metadata } from 'next'
import { Geist, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Signal — Communication Coach',
  description: 'Get private, personalized coaching on your workplace conversations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-geist-sans)]">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
