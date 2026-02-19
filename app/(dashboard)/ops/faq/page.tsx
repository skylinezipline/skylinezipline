"use client"

import { useState } from "react"
import { Plus, Search, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"
import { useAppStore } from "@/lib/mock-store"
import { toast } from "sonner"

const categories = ["All", "General", "Preparation", "Weather", "Booking", "Safety"]

export default function FAQPage() {
  const { state, dispatch } = useAppStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = state.faqItems
    .filter(f => categoryFilter === "All" || f.category === categoryFilter)
    .filter(f =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )

  function handleCreateFAQ(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    dispatch({
      type: "ADD_FAQ",
      item: {
        id: `faq-${Date.now()}`,
        question: String(fd.get("question") || ""),
        answer: String(fd.get("answer") || ""),
        category: String(fd.get("category") || "General"),
        tags: String(fd.get("tags") || "").split(",").map(t => t.trim()).filter(Boolean),
        published: true,
        usedByAI: true,
        createdAt: new Date().toISOString().split("T")[0],
      },
    })
    setCreateOpen(false)
    toast.success("FAQ item created")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions for guests and AI</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add FAQ</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add FAQ Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFAQ} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" name="question" required placeholder="What is the question?" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea id="answer" name="answer" required rows={4} placeholder="Provide a detailed answer..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="General">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== "All").map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" name="tags" placeholder="tag1, tag2" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create FAQ</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-8 h-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">{filtered.length} items</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No FAQ items match your search</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="flex flex-col gap-2">
          {filtered.map(faq => (
            <AccordionItem key={faq.id} value={faq.id} className="rounded-lg border px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center gap-3 pr-4 text-left">
                  <span className="text-sm font-medium">{faq.question}</span>
                  <Badge variant="outline" className="shrink-0 text-xs">{faq.category}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-4 pb-2">
                  <p className="text-sm leading-relaxed text-foreground">{faq.answer}</p>
                  <div className="flex flex-wrap gap-1">
                    {faq.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={faq.published}
                        onCheckedChange={(checked) => dispatch({ type: "UPDATE_FAQ", id: faq.id, updates: { published: checked } })}
                      />
                      <Label className="text-xs text-muted-foreground">Published</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={faq.usedByAI}
                        onCheckedChange={(checked) => dispatch({ type: "UPDATE_FAQ", id: faq.id, updates: { usedByAI: checked } })}
                      />
                      <Label className="text-xs text-muted-foreground">Used by AI Bot</Label>
                    </div>
                    <div className="flex-1" />
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => toast.info("Edit dialog would open")}>
                      <Edit2 className="mr-1 h-3 w-3" />Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => toast.info("Delete confirmation would appear")}>
                      <Trash2 className="mr-1 h-3 w-3" />Delete
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
