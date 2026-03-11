import Link from 'next/link';
import GradientText from '@/components/ui/GradientText';

const productLinks = [
  { href: '/product', label: 'Platform' },
  { href: '/product#architecture', label: 'Architecture' },
  { href: '/product#processors', label: 'Processors' },
  { href: '/product#governance', label: 'Governance' },
];

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: 'https://github.com', label: 'GitHub' },
];

export default function Footer() {
  return (
    <footer className="bg-bg2 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold">
              <GradientText>Foundatation</GradientText>
            </Link>
            <p className="text-text-muted mt-3 text-sm leading-relaxed">
              Data is the foundation to AI.
            </p>
            <p className="text-text-dim text-xs mt-4">
              &copy; {new Date().getFullYear()} Foundatation. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-text-dim text-center">
            Built on Apache NiFi &mdash; the enterprise standard for data flow.
          </p>
        </div>
      </div>
    </footer>
  );
}
