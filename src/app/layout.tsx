import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

// Initialize Sentry for client-side
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  require('../../sentry.client.config');
}

export const metadata: Metadata = {
  title: 'StatJam — NBA-Level Stats, Real-Time, Zero Friction',
  description: 'Professional basketball tournament platform with NBA-level automation, real-time stat tracking, and live game streaming. Built for tournaments, teams, and coaches who demand pro-level precision — anywhere, anytime.',
  keywords: ['basketball stats', 'tournament management', 'real-time scoring', 'stat tracking', 'basketball tournament', 'live sports stats', 'NBA stats', 'basketball analytics'],
  authors: [{ name: 'StatJam' }],
  creator: 'StatJam',
  publisher: 'StatJam',
  metadataBase: new URL('https://statjam.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://statjam.net',
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
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZDQY6DNZG6"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZDQY6DNZG6', {
                page_path: window.location.pathname,
              });
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
        </AuthProvider>
      </body>
    </html>
  )
}