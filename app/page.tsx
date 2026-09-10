import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token_hash?: string; type?: string; next?: string }>
}) {
  const params = await searchParams

  if (params.code) {
    const targetRedirect = params.next || '/reset-password'
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&redirectTo=${encodeURIComponent(targetRedirect)}`)
  }

  if (params.token_hash && params.type) {
    const targetRedirect = params.next || '/reset-password'
    redirect(`/auth/callback?token_hash=${encodeURIComponent(params.token_hash)}&type=${encodeURIComponent(params.type)}&redirectTo=${encodeURIComponent(targetRedirect)}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
