"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Send, Orbit, User, BookOpen, ExternalLink, Copy, Check,
  ChevronRight, Shield, MessageCircle, Code2, Sparkles,
  AlertTriangle, AlertCircle, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAppStore } from "@/lib/mock-store"
import { queryOracle, queryOracleGuest, type OracleResponse } from "@/lib/oracle-engine"
import { faqItems, resources } from "@/lib/mock-data"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  response?: OracleResponse
  timestamp: Date
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SiteOraclePage() {
  const { state } = useAppStore()
  const [tab, setTab] = useState<"internal" | "widget" | "embed">("internal")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Orbit className="h-6 w-6 text-primary" />
            Site Oracle
          </h1>
          <p className="text-muted-foreground">AI-powered knowledge base with full access to your operational data</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Code2 className="mr-2 h-4 w-4" />Embed Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Embed Site Oracle on Your Website</DialogTitle>
            </DialogHeader>
            <EmbedCodePanel />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="internal" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />Internal Ops
          </TabsTrigger>
          <TabsTrigger value="widget" className="gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />Guest Widget Preview
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-1.5">
            <Code2 className="h-3.5 w-3.5" />Embed Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="mt-4">
          <InternalChat state={state} />
        </TabsContent>
        <TabsContent value="widget" className="mt-4">
          <GuestWidgetPreview />
        </TabsContent>
        <TabsContent value="embed" className="mt-4">
          <EmbedConfigPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// INTERNAL CHAT - Full Ops Access
// ============================================================
function InternalChat({ state }: { state: ReturnType<typeof useAppStore>["state"] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const oracleCtx = useMemo(() => ({
    selectedLocationId: state.selectedLocationId,
    bookings: state.bookings,
    equipment: state.equipment,
    inspections: state.inspections,
    maintenance: state.maintenance,
    invoices: state.invoices,
    faqItems: state.faqItems,
    leads: state.leads,
  }), [state])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: `msg-${Date.now()}`, role: "user", content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const response = queryOracle(userMsg.content, oracleCtx)
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-oracle`,
        role: "assistant",
        content: response.answer,
        response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
      setIsTyping(false)
    }, 600 + Math.random() * 800)
  }

  const quickQueries = [
    "Give me today's overview",
    "How many bookings today?",
    "Revenue status",
    "Equipment health check",
    "Any overdue maintenance?",
    "Certificate expirations",
    "Outstanding waivers",
    "Staff at this location",
  ]

  const relatedFAQs = faqItems.filter(f => f.usedByAI).slice(0, 5)
  const latestResponse = [...messages].reverse().find(m => m.role === "assistant")?.response

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="flex h-[640px] flex-col">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <Orbit className="h-4 w-4 text-primary" />
              </div>
              <span>Oracle - Internal Mode</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                <Shield className="mr-1 h-2.5 w-2.5" />Full Data Access
              </Badge>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Orbit className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Site Oracle</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Ask me anything about your operations - bookings, revenue, equipment, staff, inspections, and more.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {quickQueries.slice(0, 4).map(q => (
                      <Button key={q} size="sm" variant="outline" className="text-xs" onClick={() => setInput(q)}>
                        <Sparkles className="mr-1 h-3 w-3" />{q}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {quickQueries.slice(4).map(q => (
                      <Button key={q} size="sm" variant="outline" className="text-xs" onClick={() => setInput(q)}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Orbit className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>

                    {/* Data cards */}
                    {msg.response?.data && msg.response.data.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {msg.response.data.map((d, i) => (
                          <div key={i} className="rounded-md border bg-background/50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</p>
                            <p className="text-sm font-bold text-foreground">{d.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Severity indicator */}
                    {msg.response?.severity && msg.response.severity !== "info" && (
                      <div className={`mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
                        msg.response.severity === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-chart-5/10 text-chart-5"
                      }`}>
                        {msg.response.severity === "critical" ? <AlertCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {msg.response.severity === "critical" ? "Requires immediate attention" : "Needs review"}
                      </div>
                    )}

                    {/* Deep link */}
                    {msg.response?.deepLink && (
                      <Link
                        href={msg.response.deepLink}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View details <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}

                    {/* Sources */}
                    {msg.response?.sources && msg.response.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 border-t border-border/30 pt-2">
                        {msg.response.sources.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            <BookOpen className="mr-1 h-2.5 w-2.5" />{s.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-2/10">
                      <User className="h-4 w-4 text-chart-2" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Orbit className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
              <Input
                placeholder="Ask about bookings, revenue, equipment, staff..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-4">
        {latestResponse?.data && latestResponse.data.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />Data Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {latestResponse.data.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="text-sm font-bold">{d.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Queries</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {quickQueries.map(q => (
              <button
                key={q}
                className="flex items-start gap-2 rounded-md p-2 text-left text-xs hover:bg-muted transition-colors"
                onClick={() => setInput(q)}
              >
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="leading-relaxed">{q}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FAQ Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {relatedFAQs.map(faq => (
              <button
                key={faq.id}
                className="flex items-start gap-2 rounded-md p-2 text-left text-xs hover:bg-muted transition-colors"
                onClick={() => setInput(faq.question)}
              >
                <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="leading-relaxed">{faq.question}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resources</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {resources.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center gap-2 rounded-md p-2 text-xs">
                <BookOpen className="h-3 w-3 text-muted-foreground" />
                <span className="flex-1">{r.title}</span>
                <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// GUEST WIDGET PREVIEW
// ============================================================
function GuestWidgetPreview() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [widgetOpen, setWidgetOpen] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: `guest-${Date.now()}`, role: "user", content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    setTimeout(() => {
      const response = queryOracleGuest(userMsg.content)
      setMessages(prev => [...prev, {
        id: `guest-${Date.now()}-ai`,
        role: "assistant",
        content: response.answer,
        response,
        timestamp: new Date(),
      }])
      setIsTyping(false)
    }, 500 + Math.random() * 700)
  }

  const guestQuickQueries = ["What's the minimum age?", "How much does it cost?", "What should I wear?", "Cancellation policy?"]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Preview description */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest-Facing Widget Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is how the Site Oracle chat widget will appear to visitors on your website. It answers common guest
              questions about tours, pricing, safety, weather policies, and booking. It has access only to public FAQ
              data -- no internal operations data is exposed.
            </p>
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold mb-2">Widget Capabilities</h4>
              <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Tour pricing and packages</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Age and weight requirements</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />What to wear guidance</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Weather and cancellation policies</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Safety and certification info</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Location addresses and directions</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Waiver and booking process</li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" />Tour duration details</li>
              </ul>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h4 className="text-sm font-semibold mb-1 text-destructive">Data Boundary</h4>
              <p className="text-xs text-muted-foreground">
                The guest widget has NO access to internal data: bookings, revenue, equipment status, staff info, or maintenance records. It only answers from the public FAQ knowledge base.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget simulator */}
      <div className="relative">
        <div className="rounded-lg border bg-gradient-to-b from-muted/30 to-muted/10 p-8 min-h-[600px] flex items-end justify-end">
          <p className="absolute top-4 left-4 text-xs text-muted-foreground">your-website.com</p>

          {!widgetOpen ? (
            <button
              onClick={() => setWidgetOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          ) : (
            <div className="w-full max-w-sm rounded-xl border bg-background shadow-2xl flex flex-col" style={{ height: 480 }}>
              {/* Widget header */}
              <div className="flex items-center gap-3 rounded-t-xl bg-primary px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Orbit className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary-foreground">Site Oracle</p>
                  <p className="text-[10px] text-primary-foreground/70">Ask us anything about our tours</p>
                </div>
                <button onClick={() => setWidgetOpen(false)} className="text-primary-foreground/60 hover:text-primary-foreground text-lg font-bold">&times;</button>
              </div>

              {/* Chat area */}
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="flex flex-col gap-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center py-6 text-center">
                      <Orbit className="mb-2 h-8 w-8 text-primary/40" />
                      <p className="text-xs text-muted-foreground mb-3">How can I help you today?</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {guestQuickQueries.map(q => (
                          <button
                            key={q}
                            className="rounded-full border px-2.5 py-1 text-[10px] hover:bg-muted transition-colors"
                            onClick={() => setInput(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.role === "assistant" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Orbit className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <p className="text-xs leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Orbit className="h-3 w-3 text-primary" />
                      </div>
                      <div className="rounded-lg bg-muted px-3 py-2">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-2">
                <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-1.5">
                  <Input
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                  <Button type="submit" size="sm" disabled={!input.trim() || isTyping} className="h-8 w-8 p-0">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>

              <div className="border-t px-3 py-1.5 text-center">
                <p className="text-[9px] text-muted-foreground">Powered by Zipline OS Site Oracle</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EMBED CODE PANEL
// ============================================================
function EmbedCodePanel() {
  const [copied, setCopied] = useState(false)

  const embedCode = `<!-- Zipline OS Site Oracle Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://your-domain.com/widget/oracle.js';
    s.async = true;
    s.dataset.siteId = 'YOUR_SITE_ID';
    s.dataset.position = 'bottom-right';
    s.dataset.primaryColor = '#2d6a4f';
    s.dataset.greeting = 'Ask us anything about our tours!';
    document.head.appendChild(s);
  })();
</script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success("Embed code copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Add this script tag to your website to embed the guest-facing Site Oracle chat widget.
        It will appear as a floating chat bubble in the bottom-right corner.
      </p>
      <div className="relative">
        <pre className="rounded-lg bg-muted p-4 text-xs font-mono overflow-x-auto leading-relaxed">
          {embedCode}
        </pre>
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2"
          onClick={handleCopy}
        >
          {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="rounded-lg border p-4 flex flex-col gap-2">
        <h4 className="text-sm font-semibold">Configuration Options</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><code className="bg-muted px-1 rounded text-[10px]">data-site-id</code><p className="text-muted-foreground mt-0.5">Your unique site identifier</p></div>
          <div><code className="bg-muted px-1 rounded text-[10px]">data-position</code><p className="text-muted-foreground mt-0.5">bottom-right, bottom-left</p></div>
          <div><code className="bg-muted px-1 rounded text-[10px]">data-primary-color</code><p className="text-muted-foreground mt-0.5">Brand color for the widget</p></div>
          <div><code className="bg-muted px-1 rounded text-[10px]">data-greeting</code><p className="text-muted-foreground mt-0.5">Initial greeting message</p></div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EMBED CONFIG PAGE
// ============================================================
function EmbedConfigPage() {
  const [siteId] = useState("zipline-os-" + Math.random().toString(36).slice(2, 8))
  const [position, setPosition] = useState("bottom-right")
  const [greeting, setGreeting] = useState("Ask us anything about our tours!")
  const [copied, setCopied] = useState(false)

  const embedCode = `<!-- Zipline OS Site Oracle Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://your-domain.com/widget/oracle.js';
    s.async = true;
    s.dataset.siteId = '${siteId}';
    s.dataset.position = '${position}';
    s.dataset.primaryColor = '#2d6a4f';
    s.dataset.greeting = '${greeting}';
    document.head.appendChild(s);
  })();
</script>`

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Widget Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Site ID</label>
            <Input value={siteId} readOnly className="font-mono text-xs bg-muted" />
            <p className="text-xs text-muted-foreground">Unique identifier for your widget instance</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Position</label>
            <div className="flex gap-2">
              {["bottom-right", "bottom-left"].map(pos => (
                <Button
                  key={pos}
                  variant={position === pos ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPosition(pos)}
                  className="text-xs"
                >
                  {pos}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Greeting Message</label>
            <Input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="text-sm font-semibold mb-2">Data Access Rules</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /><span>FAQ knowledge base (public questions)</span></div>
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /><span>Tour pricing and packages</span></div>
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /><span>Location information</span></div>
              <div className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /><span>Safety and policy info</span></div>
              <div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-3 w-3" /><span>No booking data access</span></div>
              <div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-3 w-3" /><span>No revenue or financial data</span></div>
              <div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-3 w-3" /><span>No staff or equipment data</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Embed Code
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(embedCode)
                setCopied(true)
                toast.success("Copied to clipboard")
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? "Copied" : "Copy Code"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {embedCode}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {"Paste this code snippet just before the closing </body> tag on any page where you want the chat widget to appear. The widget loads asynchronously and won't affect page performance."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
