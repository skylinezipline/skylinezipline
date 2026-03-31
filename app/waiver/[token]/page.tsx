"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2, PenLine } from "lucide-react"

interface WaiverGuest {
  id: string
  name: string
  age: number
  isMinor: boolean
  waiverStatus: string
  booking: {
    date: string
    time: string
    location: {
      name: string
      address: string | null
      city: string | null
      state: string | null
    }
  }
}

export default function WaiverPage() {
  const { token } = useParams<{ token: string }>()
  const [guest, setGuest] = useState<WaiverGuest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [signatureName, setSignatureName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [ageAgreed, setAgeAgreed] = useState(false)
  const [riskAgreed, setRiskAgreed] = useState(false)
  const [photoAgreed, setPhotoAgreed] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/waivers?token=${token}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Invalid or expired waiver link.")
          return
        }
        const data = await res.json()
        setGuest(data)
        if (data.waiverStatus === "SIGNED") setSigned(true)
      } catch {
        setError("Could not load waiver. Please contact the tour operator.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  async function handleSign() {
    if (!signatureName.trim() || !agreed || !ageAgreed || !riskAgreed) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/waivers/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signatureName, agreedToTerms: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to submit waiver.")
        return
      }
      setSigned(true)
    } catch {
      setError("Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Unable to load waiver</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h2 className="text-xl font-semibold">Waiver Signed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you, <strong>{guest?.name}</strong>. Your waiver has been recorded.
              See you on {guest?.booking.date} at {guest?.booking.time}!
            </p>
            <p className="mt-4 text-sm font-medium">{guest?.booking.location.name}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const location = guest?.booking.location
  const canSubmit = signatureName.trim().length > 0 && agreed && ageAgreed && riskAgreed

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{location?.name}</h1>
          <p className="text-muted-foreground">
            {location?.city}, {location?.state}
          </p>
        </div>

        {/* Booking info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Booking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Guest</p>
              <p className="font-medium">{guest?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{guest?.booking.date}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-medium">{guest?.booking.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Age</p>
              <p className="font-medium">{guest?.age}</p>
            </div>
          </CardContent>
        </Card>

        {/* Waiver text */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participant Waiver & Release of Liability</CardTitle>
            <CardDescription>Please read this entire document carefully before signing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">ASSUMPTION OF RISK:</strong> I understand and acknowledge that
              zipline and adventure activities involve inherent risks of injury, including but not limited to falls,
              collisions, equipment failure, and other hazards. I voluntarily assume all such risks.
            </p>
            <p>
              <strong className="text-foreground">RELEASE OF LIABILITY:</strong> In consideration of being permitted
              to participate, I hereby release, waive, and discharge the tour operator, its officers, employees,
              agents, and assigns from any and all liability, claims, demands, and causes of action arising out of
              or relating to any loss, damage, or injury that may be sustained during participation.
            </p>
            <p>
              <strong className="text-foreground">MEDICAL CONDITIONS:</strong> I represent that I am in good
              physical condition and have no medical conditions that would prevent safe participation. I understand
              that weight limits apply (typically 70–250 lbs) and that I may be turned away if I do not meet
              requirements.
            </p>
            <p>
              <strong className="text-foreground">RULES & INSTRUCTIONS:</strong> I agree to follow all safety
              instructions provided by staff, to wear required safety equipment at all times, and to immediately
              report any safety concerns to a guide.
            </p>
            <p>
              <strong className="text-foreground">GOVERNING LAW:</strong> This agreement shall be governed by the
              laws of the state in which the activity takes place. If any provision is found to be unenforceable,
              the remainder shall continue in full effect.
            </p>
          </CardContent>
        </Card>

        {/* Checkboxes */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="risk"
                checked={riskAgreed}
                onCheckedChange={(v) => setRiskAgreed(!!v)}
              />
              <Label htmlFor="risk" className="text-sm leading-relaxed cursor-pointer">
                I have read and understand the <strong>Assumption of Risk</strong> section. I voluntarily choose
                to participate knowing the risks involved.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="age"
                checked={ageAgreed}
                onCheckedChange={(v) => setAgeAgreed(!!v)}
              />
              <Label htmlFor="age" className="text-sm leading-relaxed cursor-pointer">
                {guest?.isMinor
                  ? "I am the parent or legal guardian of this minor participant and authorize their participation."
                  : "I confirm that I am 18 years of age or older, or have obtained parental consent."}
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="photo"
                checked={photoAgreed}
                onCheckedChange={(v) => setPhotoAgreed(!!v)}
              />
              <Label htmlFor="photo" className="text-sm leading-relaxed cursor-pointer">
                I consent to photographs and videos being taken during the activity and their use in promotional
                materials. (Optional — you may uncheck this.)
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(!!v)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I have read the full <strong>Release of Liability</strong> and agree to all terms and conditions of
                this waiver.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="h-4 w-4" />
              Electronic Signature
            </CardTitle>
            <CardDescription>
              Type your full legal name below. This constitutes your electronic signature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sig">Full Name</Label>
              <Input
                id="sig"
                placeholder="e.g. Jane Smith"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              By typing your name and clicking Sign Waiver, you agree that this electronic signature is legally
              binding and equivalent to your handwritten signature.
            </p>
            <Button
              className="w-full"
              disabled={!canSubmit || submitting}
              onClick={handleSign}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><PenLine className="mr-2 h-4 w-4" /> Sign Waiver</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
