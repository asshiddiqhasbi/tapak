'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './logout-button'

export default function NavLinks() {
  const pathname = usePathname()

  const links = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/library',
      label: 'Library',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profil',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== '/dashboard' && pathname?.startsWith(link.href))

        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent-muted text-accent font-semibold border border-accent/20'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {link.icon}
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        )
      })}
      <div className="ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-border/80">
        <LogoutButton />
      </div>
    </div>
  )
}
