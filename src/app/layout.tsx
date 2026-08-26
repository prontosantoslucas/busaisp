import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import PWAProvider from '@/components/PWA/PWAProvider';
import PWAInstallBanner from '@/components/PWA/PWAInstallBanner';
import OfflineIndicator from '@/components/PWA/OfflineIndicator';

// Painel de Embarque: serifada com personalidade para títulos/marca (Fraunces),
// sans técnica e legível para o corpo (IBM Plex Sans), monoespaçada com
// algarismos tabulares para horários/códigos de linha (IBM Plex Mono) — como
// um painel real de estação, não a tipografia padrão de app genérico.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display'
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'BusaÍ SP — Ônibus em Tempo Real e Metrô/CPTM de São Paulo',
  description:
    'Acompanhe ônibus da SPTrans em tempo real com mapa interativo, previsão de chegada por parada, itinerários e status operacional do Metrô e CPTM.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon.svg' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BusaÍ SP'
  },
  applicationName: 'BusaÍ SP',
  formatDetection: {
    telephone: false
  },
  keywords: [
    'ônibus sp',
    'sptrans olho vivo',
    'metro sp',
    'cptm status',
    'tempo real onibus',
    'previsao de chegada',
    'são paulo transporte',
    'pwa onibus sp',
    'mobilidade urbana sp'
  ]
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07090E'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Aplica o tema salvo antes da primeira pintura, evita flash do tema errado */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('busaisp_theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}`
          }}
        />
      </head>
      <body>
        <PWAProvider>
          <PWAInstallBanner />
          <OfflineIndicator />
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
