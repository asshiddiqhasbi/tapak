'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/ui/logo'
import Toast from '@/components/ui/toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    searchParams.get('registered') === 'true'
      ? 'Registrasi berhasil! Silakan masuk dengan email dan kata sandi Anda.'
      : null
  )
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-sm py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Selamat Datang Kembali
        </h1>
        <p className="text-sm text-muted">
          Masuk untuk melanjutkan jurnal tontonan Anda
        </p>
      </div>

      <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      <Toast message={error} type="error" onClose={() => setError(null)} />

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Email
          </label>
          <input
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/60"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface pl-4 pr-11 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/60"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1 rounded-md"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 014.122-.963c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background hover:bg-accent-hover disabled:opacity-50 transition-all shadow-md active:scale-[0.99] mt-2"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="text-center text-xs text-muted pt-4 border-t border-border/60">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-accent hover:underline">
          Daftar Sekarang
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Column: Form */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <div>
          <Link href="/login">
            <Logo size="md" />
          </Link>
        </div>

        <Suspense fallback={<div className="py-8 text-center text-xs text-muted">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <div className="text-xs text-muted/60 text-center lg:text-left">
          &copy; {new Date().getFullYear()} Tapak. Personal Watch Journal.
        </div>
      </div>

      {/* Right Column: Visual Section */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-l border-border bg-surface p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-background/90 pointer-events-none" />

        {/* Decorative Floating Collage Grid */}
        <div className="grid grid-cols-3 gap-4 opacity-30 transform -rotate-3 scale-105 pointer-events-none transition-transform duration-700 hover:rotate-0">
          <div className="h-48 rounded-xl bg-gradient-to-b from-amber-500/20 to-accent/30 border border-accent/20 p-4 flex flex-col justify-between animate-pulse">
            <span className="text-[10px] font-bold uppercase text-accent bg-accent-muted px-2 py-0.5 rounded w-fit">ANIME</span>
            <div className="h-2 w-16 bg-accent/40 rounded" />
          </div>
          <div className="h-48 rounded-xl bg-gradient-to-b from-blue-500/20 to-purple-500/20 border border-blue-500/20 p-4 flex flex-col justify-between animate-pulse duration-1000">
            <span className="text-[10px] font-bold uppercase text-blue-300 bg-blue-950 px-2 py-0.5 rounded w-fit">SERIES</span>
            <div className="h-2 w-20 bg-blue-400/40 rounded" />
          </div>
          <div className="h-48 rounded-xl bg-gradient-to-b from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 p-4 flex flex-col justify-between animate-pulse">
            <span className="text-[10px] font-bold uppercase text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded w-fit">FILM</span>
            <div className="h-2 w-14 bg-emerald-400/40 rounded" />
          </div>
        </div>

        {/* Brand Showcase */}
        <div className="relative z-10 my-auto max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-muted border border-accent/30 text-accent text-xs font-semibold">
            <span>✨ Personal Watch Journal</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Every Watch Leaves a Footprint.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Catat setiap episode yang kamu tonton, kelola status tontonan, dan simpan rating serta kesan pribadi dalam satu platform yang simpel.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-muted">
          <div>
            <span className="font-semibold text-foreground block">Anime & Series</span>
            <span>Progress per episode</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="font-semibold text-foreground block">Status & Rating</span>
            <span>Jurnal tontonan personal</span>
          </div>
        </div>
      </div>
    </div>
  )
}