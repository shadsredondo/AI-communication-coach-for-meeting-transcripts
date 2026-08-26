import type { Metadata } from 'next'
import { Newsreader, Hanken_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  display: 'swap',
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
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
    <html lang="en" className={`${hanken.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-hanken)]">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
