import Link from 'next/link'
import { getAuthUser } from '@/lib/supabase-server'
import NavLinks from './nav-links'
import Logo from './logo'

export default async function Navbar() {
  const user = await getAuthUser()

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/98 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
        <NavLinks />
      </div>
    </header>
  )
}