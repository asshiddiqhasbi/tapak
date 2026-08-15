'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function ProgressBarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Finish progress bar on route change
    setProgress(100)
    const timer = setTimeout(() => {
      setLoading(false)
      setProgress(0)
    }, 250)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.getAttribute('target')
      ) {
        const targetPathname = new URL(target.href).pathname
        if (targetPathname !== window.location.pathname) {
          setLoading(true)
          setProgress(35)
          setTimeout(() => setProgress(75), 180)
        }
      }
    }

    document.addEventListener('click', handleLinkClick)
    return () => document.removeEventListener('click', handleLinkClick)
  }, [])

  if (!loading && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none">
      <div
        className="h-0.5 bg-accent shadow-[0_0_10px_rgba(217,119,87,0.9)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  )
}
