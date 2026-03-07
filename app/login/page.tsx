"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/ops/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password")
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-40">
        {[
          { top: "8%", left: "15%", size: 2 },
          { top: "12%", left: "72%", size: 1 },
          { top: "5%", left: "45%", size: 2 },
          { top: "18%", left: "88%", size: 1 },
          { top: "22%", left: "30%", size: 1 },
          { top: "7%", left: "60%", size: 2 },
          { top: "3%", left: "25%", size: 1 },
          { top: "15%", left: "55%", size: 1 },
          { top: "10%", left: "82%", size: 2 },
          { top: "25%", left: "5%", size: 1 },
          { top: "6%", left: "35%", size: 1 },
          { top: "20%", left: "65%", size: 2 },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
            }}
          />
        ))}
      </div>

      {/* Mountain silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back mountains */}
        <path
          d="M0,400 L0,280 L120,160 L240,220 L360,100 L480,200 L600,80 L720,180 L840,60 L960,170 L1080,110 L1200,190 L1320,130 L1440,200 L1440,400 Z"
          fill="#0f2318"
          opacity="0.9"
        />
        {/* Mid mountains */}
        <path
          d="M0,400 L0,340 L100,250 L200,310 L320,200 L440,280 L560,180 L660,260 L780,170 L880,240 L1000,200 L1120,270 L1240,210 L1360,280 L1440,240 L1440,400 Z"
          fill="#0a1f14"
          opacity="0.95"
        />
        {/* Front ridge */}
        <path
          d="M0,400 L0,370 L180,320 L360,355 L540,300 L720,340 L900,295 L1080,335 L1260,310 L1440,345 L1440,400 Z"
          fill="#061410"
        />
      </svg>

      {/* Zipline cable */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30"
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="0" y1="80" x2="1440" y2="420" stroke="#6ee7b7" strokeWidth="1.5" />
        {/* Rider silhouette on cable */}
        <circle cx="900" cy="285" r="5" fill="#6ee7b7" opacity="0.7" />
        <line x1="900" y1="285" x2="900" y2="300" stroke="#6ee7b7" strokeWidth="1.5" />
        <line x1="896" y1="293" x2="904" y2="293" stroke="#6ee7b7" strokeWidth="1.5" />
      </svg>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17 L21 7" strokeLinecap="round" />
              <circle cx="17" cy="9.5" r="2" fill="currentColor" stroke="none" />
              <path d="M17 11.5 L17 15 M14.5 13 L19.5 13" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Zipline OS</h1>
          <p className="mt-1 text-sm text-emerald-400/70">Operator Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
          <h2 className="mb-6 text-base font-semibold text-white">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-emerald-500/60 focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/60"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-emerald-500/60 focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/60"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-emerald-400 hover:text-emerald-300">
            Get started free
          </Link>
        </p>
      </div>
    </div>
  )
}
