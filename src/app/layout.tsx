export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Wojo Ping Pong League',
  description: 'La ligue de ping pong du coworking Wojo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wojo PPL',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#3BBCD0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-black text-gray-50 min-h-screen">
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
          document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
          document.addEventListener('touchmove', function(e) { if(e.touches.length > 1) e.preventDefault(); }, { passive: false });
        `}} />
        <Navigation />
        <main className="container mx-auto px-4 pb-16 max-w-5xl">
          {children}
        </main>
      </body>
    </html>
  )
}
