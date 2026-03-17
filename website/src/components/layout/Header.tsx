'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';

type NavChild = { href: string; label: string; desc?: string; color?: string };
type NavItem =
  | { href: string; label: string; children?: undefined }
  | { href: string; label: string; children: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Platform' },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { href: '/solutions/consulting', label: 'AI Business Consulting', desc: 'Strategy & feasibility', color: '#7c3aed' },
      { href: '/solutions/migration', label: 'Prototype-to-Production', desc: 'Migration & scaling', color: '#3b82f6' },
      { href: '/solutions', label: 'AgentFlow Platform', desc: 'AI agent orchestration', color: '#06b6d4' },
    ],
  },
  {
    label: 'About',
    href: '/about',
    children: [
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="text-xl font-bold">
            <GradientText>Foundatation</GradientText>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" ref={navRef}>
            {NAV_ITEMS.map((item) =>
              item.children ? (
                /* Dropdown item */
                <div key={item.label} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === item.label ? null : item.label)
                    }
                    className={`text-sm transition-colors flex items-center gap-1 ${
                      item.children.some((c) => isActive(c.href))
                        ? 'text-text-primary font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {openDropdown === item.label && (
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-bg2/95 backdrop-blur-xl border border-border rounded-lg shadow-xl py-2 ${
                        item.children.some((c) => c.desc) ? 'w-72' : 'w-44'
                      }`}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive(child.href)
                              ? 'text-text-primary font-medium bg-white/5'
                              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                          }`}
                        >
                          {child.color && (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: child.color }}
                            />
                          )}
                          <div>
                            <div className={child.desc ? 'font-semibold text-text-primary' : ''}>
                              {child.label}
                            </div>
                            {child.desc && (
                              <div className="text-xs text-text-dim">{child.desc}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Regular link */
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    pathname === item.href
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Button variant="primary" href="/contact">
              Request Demo
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <span
              className={`block h-0.5 w-6 bg-text-primary transition-transform ${
                mobileOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-text-primary transition-opacity ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-text-primary transition-transform ${
                mobileOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden bg-bg/95 backdrop-blur-xl border-b border-border">
          <nav className="flex flex-col px-4 py-4 gap-3">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <p className="text-xs uppercase tracking-wider text-text-dim mt-2 mb-1">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={`text-sm py-2 block transition-colors pl-4 ${
                        isActive(child.href)
                          ? 'text-text-primary font-medium'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm py-2 transition-colors ${
                    pathname === item.href
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="pt-2">
              <Button variant="primary" href="/contact" className="w-full">
                Request Demo
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
