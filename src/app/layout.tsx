import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BusaÍ SP — Ônibus em Tempo Real e Metrô/CPTM de São Paulo',
  description:
    'Acompanhe ônibus da SPTrans em tempo real com mapa interativo, previsão de chegada por parada e status operacional do Metrô e CPTM.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BusaÍ SP'
  },
  applicationName: 'BusaÍ SP',
  keywords: [
    'ônibus sp',
    'sptrans olho vivo',
    'metro sp',
    'cptm status',
    'tempo real onibus',
    'previsao de chegada',
    'são paulo transporte'
  ]
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0F19'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
