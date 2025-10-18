import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'

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
        <AuthProvider>
          <ErrorBoundary showDetails={true}>
            {children}
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}