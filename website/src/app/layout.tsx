import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.foundatation.com'),
  title: {
    default: 'Foundatation | Enterprise AI Orchestration & Governance on Apache NiFi',
    template: '%s | Foundatation',
  },
  description:
    'Foundatation provides AgentFlow, the only enterprise AI agent orchestration platform built on Apache NiFi. Scale production-grade AI with built-in governance, data provenance, and human-in-the-loop controls.',
  keywords: [
    'AI agents',
    'enterprise AI',
    'agent orchestration',
    'Apache NiFi',
    'AgentFlow',
    'AI governance',
    'data foundation',
    'AI compliance',
    'data provenance',
    'LLM orchestration',
    'human-in-the-loop AI',
    'enterprise data pipeline',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '256x256', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.foundatation.com',
    siteName: 'Foundatation',
    description:
      'Foundatation provides AgentFlow, the only enterprise AI agent orchestration platform built on Apache NiFi. Scale production-grade AI with built-in governance, data provenance, and human-in-the-loop controls.',
    images: [
      {
        url: 'https://www.foundatation.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foundatation \u2014 The Enterprise Data Foundation for AI',
    description:
      'Foundatation provides AgentFlow, the only enterprise AI agent orchestration platform built on Apache NiFi. Scale production-grade AI with built-in governance, data provenance, and human-in-the-loop controls.',
    images: ['https://www.foundatation.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.foundatation.com',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.foundatation.com/#organization',
      name: 'Foundatation',
      url: 'https://www.foundatation.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.foundatation.com/favicon.svg',
      },
      description:
        'Foundatation delivers Enterprise Scale Product Enabled Services \u2014 from data preparation to production AI agents. Built on Apache NiFi.',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'info@foundatation.com',
        contactType: 'sales',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.foundatation.com/#website',
      url: 'https://www.foundatation.com',
      name: 'Foundatation',
      description:
        'Foundatation provides AgentFlow, the only enterprise AI agent orchestration platform built on Apache NiFi. Scale production-grade AI with built-in governance, data provenance, and human-in-the-loop controls.',
      publisher: {
        '@id': 'https://www.foundatation.com/#organization',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-bg text-text-primary antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
