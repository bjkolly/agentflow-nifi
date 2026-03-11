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
    default: 'Foundatation \u2014 The Enterprise Data Foundation for AI',
    template: '%s | Foundatation',
  },
  description:
    'AgentFlow brings enterprise governance, scalability, and auditability to AI agent orchestration. Built on Apache NiFi for Fortune 500 production.',
  keywords: [
    'AI agents',
    'enterprise AI',
    'agent orchestration',
    'Apache NiFi',
    'AgentFlow',
    'AI governance',
    'data foundation',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.foundatation.com',
    siteName: 'Foundatation',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-bg text-text-primary antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
