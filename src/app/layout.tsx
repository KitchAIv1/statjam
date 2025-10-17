import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'StatJam - Your Courtside Command Center',
  description: 'Professional-grade sports tournament app for real-time stat tracking and tournament management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary showDetails={true}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}