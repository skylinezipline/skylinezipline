"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Check } from "lucide-react"

const FEATURES = [
  "Booking & scheduling management",
  "Equipment inspections & maintenance",
  "Staff scheduling automation",
  "Lead pipeline & marketing tools",
  "Waiver tracking & check-in",
  "Multi-location support",
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Something went wrong")
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (signInRes?.error) {
      router.push("/login")
    } else {
      router.push("/onboarding")
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Left: feature pitch */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold text-white">Zipline OS</h1>
          <p className="mt-1 text-sm text-neutral-400">Operator Platform</p>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Everything you need to run your zipline operation.
          </h2>
          <p className="mt-4 text-neutral-400">
            Built specifically for zipline and adventure park operators. Replace your spreadsheets
            and fragmented tools with one complete platform.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-neutral-300">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <Check className="h-3 w-3 text-white" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-neutral-600">© 2026 Zipline OS. All rights reserved.</p>
      </div>

      {/* Right: signup form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden text-center">
            <h1 className="text-2xl font-bold text-white">Zipline OS</h1>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
            <h2 className="mb-2 text-lg font-semibold text-white">Create your account</h2>
            <p className="mb-6 text-sm text-neutral-400">Free to get started. No credit card required.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Jake Torres"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Work email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
                  minLength={8}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Min. 8 characters"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-neutral-500">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
