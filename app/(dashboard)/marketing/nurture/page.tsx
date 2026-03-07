"use client"

import { useState, useRef, useCallback } from "react"
import {
  Mail, MessageSquare, Clock, GitBranch, ArrowRight, Eye, MousePointerClick, Reply,
  BarChart3, GripVertical, Plus, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { StatusBadge } from "@/components/status-badge"
import { nurtureSequences as initialSequences } from "@/lib/mock-data"
import type { NurtureSequence, NurtureStep } from "@/lib/types"
import { toast } from "sonner"

const stepIcons: Record<string, React.ReactNode> = {
  Email: <Mail className="h-4 w-4" />, SMS: <MessageSquare className="h-4 w-4" />,
  Wait: <Clock className="h-4 w-4" />, Condition: <GitBranch className="h-4 w-4" />,
}
const stepColors: Record<string, string> = {
  Email: "bg-primary/10 text-primary border-primary/20",
  SMS: "bg-accent/10 text-accent border-accent/20",
  Wait: "bg-muted text-muted-foreground border-muted",
  Condition: "bg-chart-3/10 text-chart-3 border-chart-3/20",
}

function StepNode({ step, isDragging }: { step: NurtureStep; isDragging?: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${stepColors[step.type] || ""} ${isDragging ? "opacity-50 ring-2 ring-primary" : ""}`}>
      <div className="mt-0.5 shrink-0">{stepIcons[step.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase">{step.type}</span>
          {step.type === "Wait" && step.waitDays && <Badge variant="outline" className="text-[10px]">{step.waitDays} day{step.waitDays > 1 ? "s" : ""}</Badge>}
        </div>
        {step.subject && <p className="mt-1 text-sm font-medium">{step.subject}</p>}
        {step.body && <p className="mt-0.5 text-xs text-foreground/70 line-clamp-2">{step.body}</p>}
        {step.type === "Condition" && <p className="mt-1 text-xs">If <span className="font-medium">{step.conditionField}</span> = <span className="font-medium">{step.conditionValue}</span></p>}
      </div>
    </div>
  )
}

export default function NurturePage() {
  const [sequences, setSequences] = useState<NurtureSequence[]>(initialSequences)
  const [selectedSeq, setSelectedSeq] = useState<NurtureSequence | null>(null)
  const [selectedStep, setSelectedStep] = useState<NurtureStep | null>(null)

  // Add Sequence dialog
  const [addSeqOpen, setAddSeqOpen] = useState(false)
  const [newSeq, setNewSeq] = useState({ name: "", description: "", trigger: "Form Submission" })

  // Add Step dialog
  const [addStepOpen, setAddStepOpen] = useState(false)
  const [newStep, setNewStep] = useState<{ type: NurtureStep["type"]; subject: string; body: string; waitDays: string; conditionField: string; conditionValue: string }>({
    type: "Email", subject: "", body: "", waitDays: "1", conditionField: "", conditionValue: "",
  })

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragRef = useRef<number | null>(null)

  const handleDragStart = useCallback((idx: number) => { setDragIdx(idx); dragRef.current = idx }, [])
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIdx(idx) }, [])
  const handleDrop = useCallback((dropIdx: number) => {
    if (dragRef.current === null || !selectedSeq) return
    const fromIdx = dragRef.current
    if (fromIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const newSteps = [...selectedSeq.steps]; const [moved] = newSteps.splice(fromIdx, 1); newSteps.splice(dropIdx, 0, moved)
    const updated = { ...selectedSeq, steps: newSteps }; setSelectedSeq(updated)
    setSequences(prev => prev.map(s => s.id === updated.id ? updated : s))
    setDragIdx(null); setDragOverIdx(null); dragRef.current = null; toast.success("Step order updated")
  }, [selectedSeq])
  const handleDragEnd = useCallback(() => { setDragIdx(null); setDragOverIdx(null); dragRef.current = null }, [])

  // Add sequence
  const handleAddSequence = () => {
    if (!newSeq.name.trim()) { toast.error("Name is required"); return }
    const seq: NurtureSequence = {
      id: `seq-${Date.now()}`, name: newSeq.name.trim(), description: newSeq.description.trim(),
      trigger: newSeq.trigger, status: "Draft", steps: [],
      metrics: { enrolled: 0, openRate: 0, clickRate: 0, replyRate: 0, conversionRate: 0 },
    }
    setSequences(prev => [...prev, seq]); toast.success("Sequence created"); setAddSeqOpen(false)
    setNewSeq({ name: "", description: "", trigger: "Form Submission" })
  }

  // Delete sequence
  const handleDeleteSequence = () => {
    if (!selectedSeq) return
    setSequences(prev => prev.filter(s => s.id !== selectedSeq.id))
    setSelectedSeq(null); setSelectedStep(null); toast.success("Sequence deleted")
  }

  // Add step
  const handleAddStep = () => {
    if (!selectedSeq) return
    const step: NurtureStep = {
      id: `step-${Date.now()}`, type: newStep.type,
      ...(newStep.type === "Email" || newStep.type === "SMS" ? { subject: newStep.subject, body: newStep.body } : {}),
      ...(newStep.type === "Wait" ? { waitDays: Number(newStep.waitDays) || 1 } : {}),
      ...(newStep.type === "Condition" ? { conditionField: newStep.conditionField, conditionValue: newStep.conditionValue } : {}),
    }
    const updated = { ...selectedSeq, steps: [...selectedSeq.steps, step] }
    setSelectedSeq(updated); setSequences(prev => prev.map(s => s.id === updated.id ? updated : s))
    setAddStepOpen(false); toast.success("Step added")
    setNewStep({ type: "Email", subject: "", body: "", waitDays: "1", conditionField: "", conditionValue: "" })
  }

  // Delete step
  const handleDeleteStep = (stepId: string) => {
    if (!selectedSeq) return
    const updated = { ...selectedSeq, steps: selectedSeq.steps.filter(s => s.id !== stepId) }
    setSelectedSeq(updated); setSequences(prev => prev.map(s => s.id === updated.id ? updated : s))
    if (selectedStep?.id === stepId) setSelectedStep(null)
    toast.success("Step removed")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Nurture Sequences</h1>
          <p className="text-muted-foreground">Automated email and SMS sequences to engage leads and customers</p>
        </div>
        {!selectedSeq && <Button onClick={() => setAddSeqOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Add Sequence</Button>}
      </div>

      {!selectedSeq ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sequences.map(seq => (
            <Card key={seq.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setSelectedSeq(seq)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{seq.name}</CardTitle>
                  <StatusBadge status={seq.status} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{seq.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Badge variant="outline" className="text-[10px]">{seq.trigger}</Badge></div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div><p className="text-lg font-bold">{seq.metrics.enrolled}</p><p className="text-[10px] text-muted-foreground">Enrolled</p></div>
                  <div><p className="text-lg font-bold">{seq.metrics.openRate}%</p><p className="text-[10px] text-muted-foreground">Open</p></div>
                  <div><p className="text-lg font-bold">{seq.metrics.clickRate}%</p><p className="text-[10px] text-muted-foreground">Click</p></div>
                  <div><p className="text-lg font-bold">{seq.metrics.conversionRate}%</p><p className="text-[10px] text-muted-foreground">Convert</p></div>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {seq.steps.slice(0, 5).map((step, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${stepColors[step.type]}`}>{stepIcons[step.type]}</span>
                      {i < Math.min(seq.steps.length - 1, 4) && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  ))}
                  {seq.steps.length > 5 && <span className="text-xs text-muted-foreground">+{seq.steps.length - 5}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
          {sequences.length === 0 && (
            <Card className="col-span-2"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="mb-3 h-10 w-10" /><p>No sequences yet. Click "Add Sequence" to create one.</p>
            </CardContent></Card>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => { setSelectedSeq(null); setSelectedStep(null) }}>Back to Sequences</Button>
            <h2 className="text-lg font-semibold">{selectedSeq.name}</h2>
            <StatusBadge status={selectedSeq.status} />
            <div className="flex-1" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete Sequence</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sequence?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{selectedSeq.name}" and all its steps. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSequence} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Sequence Flow</CardTitle>
                    <span className="text-xs text-muted-foreground">Drag steps to reorder</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Trigger */}
                    <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><BarChart3 className="h-4 w-4" /></div>
                      <div><p className="text-xs font-semibold uppercase text-primary">Trigger</p><p className="text-sm">{selectedSeq.trigger}</p></div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {selectedSeq.steps.map((step, i) => (
                        <div key={step.id}>
                          {dragOverIdx === i && dragIdx !== null && dragIdx !== i && <div className="mx-4 h-1 rounded-full bg-primary mb-1 transition-all" />}
                          <div
                            draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)}
                            onDrop={() => handleDrop(i)} onDragEnd={handleDragEnd}
                            className={`group flex items-center gap-2 cursor-pointer transition-all rounded-lg ${selectedStep?.id === step.id ? "ring-2 ring-primary" : ""} ${dragIdx === i ? "opacity-40" : ""}`}
                            onClick={() => setSelectedStep(step)}
                          >
                            <div className="flex shrink-0 cursor-grab items-center text-muted-foreground opacity-40 group-hover:opacity-100 active:cursor-grabbing"><GripVertical className="h-5 w-5" /></div>
                            <div className="flex-1"><StepNode step={step} isDragging={dragIdx === i} /></div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {i < selectedSeq.steps.length - 1 && <div className="flex justify-center py-0.5"><div className="ml-7 h-3 w-px bg-border" /></div>}
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="mt-4 w-full" onClick={() => setAddStepOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Add Step</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Enrolled", value: selectedSeq.metrics.enrolled },
                      { icon: <Eye className="h-3.5 w-3.5" />, label: "Open Rate", value: `${selectedSeq.metrics.openRate}%` },
                      { icon: <MousePointerClick className="h-3.5 w-3.5" />, label: "Click Rate", value: `${selectedSeq.metrics.clickRate}%` },
                      { icon: <Reply className="h-3.5 w-3.5" />, label: "Reply Rate", value: `${selectedSeq.metrics.replyRate}%` },
                    ].map(m => (
                      <div key={m.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">{m.icon}{m.label}</span>
                        <span className="font-semibold">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedStep && (selectedStep.type === "Email" || selectedStep.type === "SMS") && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Message Preview</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs defaultValue="preview">
                      <TabsList className="w-full">
                        <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                        <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preview" className="mt-3">
                        {selectedStep.subject && <div className="mb-2 rounded-md bg-muted p-2"><p className="text-xs text-muted-foreground">Subject</p><p className="text-sm font-medium">{selectedStep.subject}</p></div>}
                        <div className="rounded-md border p-3"><p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedStep.body}</p></div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {["{first_name}", "{tour_date}", "{location}"].map(v => <Badge key={v} variant="outline" className="text-[10px] font-mono">{v}</Badge>)}
                        </div>
                      </TabsContent>
                      <TabsContent value="edit" className="mt-3">
                        {selectedStep.subject && <div className="mb-2"><Textarea defaultValue={selectedStep.subject} rows={1} className="text-sm" /></div>}
                        <Textarea defaultValue={selectedStep.body} rows={6} className="text-sm" />
                        <Button size="sm" className="mt-2" onClick={() => toast.success("Changes saved")}>Save Changes</Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Sequence Dialog */}
      <Dialog open={addSeqOpen} onOpenChange={setAddSeqOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Nurture Sequence</DialogTitle><DialogDescription>Create an automated sequence to engage leads.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5"><Label>Name *</Label><Input placeholder="e.g., Post-Tour Follow-up" value={newSeq.name} onChange={e => setNewSeq(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>Description</Label><Textarea placeholder="What does this sequence do?" value={newSeq.description} onChange={e => setNewSeq(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="flex flex-col gap-1.5"><Label>Trigger</Label>
              <Select value={newSeq.trigger} onValueChange={v => setNewSeq(p => ({ ...p, trigger: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Form Submission">Form Submission</SelectItem>
                  <SelectItem value="Booking Confirmed">Booking Confirmed</SelectItem>
                  <SelectItem value="Post-Tour">Post-Tour</SelectItem>
                  <SelectItem value="Abandoned Cart">Abandoned Cart</SelectItem>
                  <SelectItem value="Lead Created">Lead Created</SelectItem>
                  <SelectItem value="Manual Enrollment">Manual Enrollment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddSeqOpen(false)}>Cancel</Button><Button onClick={handleAddSequence}>Create Sequence</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Step Dialog */}
      <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Step</DialogTitle><DialogDescription>Add a new step to this sequence.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Step Type</Label>
              <Select value={newStep.type} onValueChange={v => setNewStep(p => ({ ...p, type: v as NurtureStep["type"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Wait">Wait (Delay)</SelectItem>
                  <SelectItem value="Condition">Condition (Branch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newStep.type === "Email" || newStep.type === "SMS") && (
              <>
                {newStep.type === "Email" && <div className="flex flex-col gap-1.5"><Label>Subject Line</Label><Input placeholder="Subject..." value={newStep.subject} onChange={e => setNewStep(p => ({ ...p, subject: e.target.value }))} /></div>}
                <div className="flex flex-col gap-1.5"><Label>Body</Label><Textarea placeholder="Message content..." value={newStep.body} onChange={e => setNewStep(p => ({ ...p, body: e.target.value }))} rows={4} /></div>
              </>
            )}
            {newStep.type === "Wait" && <div className="flex flex-col gap-1.5"><Label>Wait Duration (days)</Label><Input type="number" min="1" value={newStep.waitDays} onChange={e => setNewStep(p => ({ ...p, waitDays: e.target.value }))} /></div>}
            {newStep.type === "Condition" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Field</Label><Input placeholder="e.g., lead_status" value={newStep.conditionField} onChange={e => setNewStep(p => ({ ...p, conditionField: e.target.value }))} /></div>
                <div className="flex flex-col gap-1.5"><Label>Value</Label><Input placeholder="e.g., Qualified" value={newStep.conditionValue} onChange={e => setNewStep(p => ({ ...p, conditionValue: e.target.value }))} /></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddStepOpen(false)}>Cancel</Button><Button onClick={handleAddStep}>Add Step</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
