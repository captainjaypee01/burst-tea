import { type FormEvent, type ReactElement, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'

const inputClass =
  'flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-colors ' +
  'placeholder:text-zinc-400 focus-visible:border-emerald-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 ' +
  'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus-visible:border-emerald-400/50 dark:focus-visible:ring-emerald-400/15'

export function LoginPage(): ReactElement {
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh w-full lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <section
        aria-label="Burst Tea"
        className="relative flex min-h-[42vh] flex-col justify-end overflow-hidden bg-zinc-950 px-8 pb-10 pt-16 sm:min-h-[46vh] sm:px-12 sm:pb-14 lg:min-h-dvh lg:justify-center lg:px-12 lg:py-16 xl:px-20"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,rgba(16,185,129,0.35),transparent_55%),radial-gradient(ellipse_100%_60%_at_100%_100%,rgba(20,184,166,0.2),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-600/10 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400/90">
            Café point of sale
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-6xl">
            Burst Tea
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-300 sm:text-lg">
            Ring up drinks, track inventory, and keep shifts flowing—built for small cafés that move fast.
          </p>
          <p className="mt-8 border-l-2 border-emerald-500/50 pl-4 text-sm italic leading-relaxed text-zinc-400">
            One bar. One queue. Orders that land where they belong.
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section
        aria-labelledby="login-heading"
        className="flex flex-col justify-center bg-zinc-50 px-6 py-12 sm:px-10 lg:min-h-dvh lg:px-12 xl:px-16 dark:bg-zinc-950"
      >
        <div className="mx-auto w-full max-w-md">
          <header>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-600 lg:hidden dark:text-emerald-400">
              Sign in
            </p>
            <h2 id="login-heading" className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 lg:mt-0 dark:text-zinc-50">
              Welcome back
            </h2>
            <p className="mt-2 hidden text-sm text-zinc-500 lg:block dark:text-zinc-400">
              Sign in with your staff email to open the till.
            </p>
          </header>

          <form
            className={cn('mt-8 space-y-5 lg:mt-10')}
            onSubmit={(e) => void onSubmit(e)}
            noValidate
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={inputClass}
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@cafe.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className={inputClass}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
              >
                {error}
              </div>
            ) : null}

            <Button
              className="h-11 w-full rounded-lg bg-emerald-600 text-base font-medium text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
            Need help? Ask a manager to reset your access.
          </p>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
