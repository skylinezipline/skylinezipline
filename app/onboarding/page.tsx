"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Building2, MapPin, Check, ArrowRight, ArrowLeft } from "lucide-react"

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Location" },
  { id: 3, label: "Done" },
]

const US_TIMEZONES = [
  { value: "America/New_York",    label: "Eastern (ET)" },
  { value: "America/Chicago",     label: "Central (CT)" },
  { value: "America/Denver",      label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Phoenix",     label: "Arizona (MST)" },
  { value: "America/Anchorage",   label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu",    label: "Hawaii (HST)" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [company, setCompany] = useState({ name: "", website: "", phone: "" })
  const [location, setLocation] = useState({
    name: "",
    city: "",
    state: "",
    timezone: "America/New_York",
  })

  async function handleFinish() {
    setError("")
    setLoading(true)

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: company.name,
        website: company.website,
        phone: company.phone,
        locationName: location.name,
        city: location.city,
        state: location.state,
        timezone: location.timezone,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      setError("Something went wrong. Please try again.")
      return
    }

    setStep(3)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Zipline OS</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {step < 3 ? "Let's get your operation set up" : "You're all set!"}
          </p>
        </div>

        {/* Step indicators */}
        {step < 3 && (
          <div className="mb-8 flex items-center justify-center gap-2">
            {STEPS.filter((s) => s.id < 3).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    step >= s.id
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span
                  className={`text-xs ${step >= s.id ? "text-white" : "text-neutral-500"}`}
                >
                  {s.label}
                </span>
                {i < 1 && <div className="mx-2 h-px w-8 bg-neutral-700" />}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
          {/* Step 1: Company */}
          {step === 1 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Your company</h2>
                  <p className="text-xs text-neutral-400">Tell us about your business</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                    Company name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Skyline Ziplines"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                    Website
                  </label>
                  <input
                    type="url"
                    value={company.website}
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="https://yoursite.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <button
                onClick={() => company.name.trim() && setStep(2)}
                disabled={!company.name.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Your first location</h2>
                  <p className="text-xs text-neutral-400">You can add more locations later</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                    Site name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={location.name}
                    onChange={(e) => setLocation({ ...location, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Skyline Ridge"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-neutral-300">City</label>
                    <input
                      type="text"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="Asheville"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-neutral-300">State</label>
                    <input
                      type="text"
                      value={location.state}
                      onChange={(e) => setLocation({ ...location, state: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="NC"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-300">Timezone</label>
                  <select
                    value={location.timezone}
                    onChange={(e) => setLocation({ ...location, timezone: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {US_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!location.name.trim() || loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Finish setup
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome to Zipline OS!</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Your account and first location are set up. You&apos;re ready to go.
              </p>

              <button
                onClick={() => router.push("/ops/dashboard")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
