import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'

export const metadata: Metadata = {
  title: 'StatJam — NBA-Level Stats, Real-Time, Zero Friction',
  description: 'Professional basketball tournament platform with NBA-level automation, real-time stat tracking, and live game streaming. Built for tournaments, teams, and coaches who demand pro-level precision — anywhere, anytime.',
  keywords: ['basketball stats', 'tournament management', 'real-time scoring', 'stat tracking', 'basketball tournament', 'live sports stats', 'NBA stats', 'basketball analytics'],
  authors: [{ name: 'StatJam' }],
  creator: 'StatJam',
  publisher: 'StatJam',
  metadataBase: new URL('https://www.statjam.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.statjam.net',
    title: 'StatJam — NBA-Level Stats, Real-Time, Zero Friction',
    description: 'Professional basketball tournament platform with NBA-level automation, real-time stat tracking, and live game streaming. Built for tournaments, teams, and coaches who demand pro-level precision.',
    siteName: 'StatJam',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'StatJam - Professional Basketball Tournament Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StatJam — NBA-Level Stats, Real-Time, Zero Friction',
    description: 'Professional basketball tournament platform with NBA-level automation and real-time stat tracking.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Performance optimization hints */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://plausible.io" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          src="https://plausible.io/js/pa-NNW082sSo-ye6M6LkIgUu.js"
          strategy="afterInteractive"
          async
        />
        <Script
          id="plausible-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.plausible = window.plausible || function() { (plausible.q = plausible.q || []).push(arguments) };
              plausible.init = plausible.init || function(i) { plausible.o = i || {} };
              plausible.init();
            `,
          }}
        />
        <AuthProvider>
          <ErrorBoundary showDetails={true}>
            {children}
          </ErrorBoundary>
          <Toaster 
            position="top-right"
            expand={true}
            richColors
            closeButton
            duration={4000}
          />
          <FeedbackButton />
        </AuthProvider>
      </body>
    </html>
  )
}