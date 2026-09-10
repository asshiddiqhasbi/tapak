import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string
    token_hash?: string
    type?: string
    next?: string
    error?: string
    error_code?: string
    error_description?: string
  }>
}) {
  const params = await searchParams

  if (params.error || params.error_code || params.error_description) {
    let msg = params.error_description || 'Tautan reset kata sandi tidak valid atau telah kadaluwarsa.'
    if (params.error_code === 'otp_expired') {
      msg = 'Tautan reset kata sandi telah kadaluwarsa atau sudah pernah digunakan. Silakan minta tautan baru.'
    }
    redirect(`/forgot-password?error=${encodeURIComponent(msg)}`)
  }

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
