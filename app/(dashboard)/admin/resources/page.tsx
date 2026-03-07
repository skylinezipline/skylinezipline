"use client"

import { useState } from "react"
import { Search, Plus, FileText, Video, Link as LinkIcon, BookOpen, ExternalLink, Upload, Folder, ChevronRight, ArrowLeft, FolderPlus, GripVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { resources } from "@/lib/mock-data"
import { toast } from "sonner"

const typeIcons: Record<string, React.ReactNode> = {
  Manual: <BookOpen className="h-5 w-5" />,
  Document: <FileText className="h-5 w-5" />,
  Video: <Video className="h-5 w-5" />,
  Link: <LinkIcon className="h-5 w-5" />,
}

// Build folder structure from categories
const folderStructure: Record<string, { label: string; subfolders: string[] }> = {
  Equipment: { label: "Equipment", subfolders: ["Inspection Forms", "Manuals", "EN Declarations", "Specs"] },
  Operations: { label: "Operations", subfolders: ["SOPs", "Checklists", "Emergency Procedures"] },
  Safety: { label: "Safety", subfolders: ["Training Materials", "Incident Reports", "Safety Plans"] },
  Marketing: { label: "Marketing", subfolders: ["Brand Assets", "Templates", "Photos"] },
  Legal: { label: "Legal", subfolders: ["Contracts", "Waivers", "Insurance"] },
  Compliance: { label: "Compliance", subfolders: ["ACCT Standards", "State Regulations", "Audit Reports"] },
  Training: { label: "Training", subfolders: ["Onboarding", "Certifications", "Refresher"] },
}

const categories = ["All", ...Object.keys(folderStructure)]

export default function ResourcesPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [currentSubfolder, setCurrentSubfolder] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addFolderOpen, setAddFolderOpen] = useState(false)
  const [localResources, setLocalResources] = useState(resources)
  const [localFolders, setLocalFolders] = useState(folderStructure)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const filtered = localResources
    .filter(r => {
      if (currentFolder && !currentSubfolder) return r.category === currentFolder
      if (currentFolder && currentSubfolder) {
        return r.category === currentFolder && r.tags.some(t => t.toLowerCase().includes(currentSubfolder.toLowerCase().split(" ")[0]))
      }
      if (categoryFilter !== "All") return r.category === categoryFilter
      return true
    })
    .filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )

  function handleAddResource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newResource = {
      id: `res-${Date.now()}`,
      title: String(fd.get("title") || "Untitled"),
      description: String(fd.get("description") || ""),
      category: String(fd.get("category") || "Equipment"),
      type: String(fd.get("type") || "Document") as "Manual" | "Document" | "Video" | "Link",
      url: String(fd.get("url") || "") || undefined,
      tags: [String(fd.get("category") || "Equipment")],
    }
    setLocalResources(prev => [newResource, ...prev])
    toast.success("Resource added successfully")
    setAddOpen(false)
  }

  function handleAddFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("folderName") || "New Folder")
    if (localFolders[name]) {
      toast.error("A folder with that name already exists")
      return
    }
    setLocalFolders(prev => ({
      ...prev,
      [name]: { label: name, subfolders: [] },
    }))
    toast.success(`Folder "${name}" created`)
    setAddFolderOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">Manuals, documents, and reference materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAddFolderOpen(true)}>
            <FolderPlus className="mr-1 h-4 w-4" />Add Folder
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Resource
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="flex items-center gap-1 text-sm">
          <button className="text-primary hover:underline" onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null) }}>
            All Folders
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <button
            className={currentSubfolder ? "text-primary hover:underline" : "font-medium"}
            onClick={() => setCurrentSubfolder(null)}
          >
            {currentFolder}
          </button>
          {currentSubfolder && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{currentSubfolder}</span>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {currentFolder && (
          <Button variant="ghost" size="sm" onClick={() => {
            if (currentSubfolder) setCurrentSubfolder(null)
            else setCurrentFolder(null)
          }}>
            <ArrowLeft className="mr-1 h-3 w-3" />Back
          </Button>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-8 h-9"
          />
        </div>
        {!currentFolder && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Upload Drop Zone */}
      <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Upload className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium">Drop files here to upload</p>
            <p className="text-xs">PDF, DOC, images, or video files</p>
          </div>
        </div>
      </div>

      {/* Folder Grid (when not inside a folder) */}
      {!currentFolder && categoryFilter === "All" && !search && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Folders</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Object.entries(localFolders).map(([key, folder]) => {
              const count = localResources.filter(r => r.category === key).length
              return (
                <button
                  key={key}
                  className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setCurrentFolder(key)}
                >
                  <Folder className="h-8 w-8 text-primary/70 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{folder.label}</p>
                    <p className="text-xs text-muted-foreground">{count} items, {folder.subfolders.length} subfolders</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Subfolder Grid (when inside a folder but not subfolder) */}
      {currentFolder && !currentSubfolder && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subfolders</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {localFolders[currentFolder]?.subfolders.map(sub => (
              <button
                key={sub}
                className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => setCurrentSubfolder(sub)}
              >
                <Folder className="h-6 w-6 text-muted-foreground shrink-0" />
                <p className="font-medium text-sm">{sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resource Cards (always show when filtering or inside a folder) */}
      {(currentFolder || categoryFilter !== "All" || search) && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Files</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(resource => (
              <Card key={resource.id} className="transition-colors hover:bg-muted/50 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={() => setDraggedItem(resource.id)}
                onDragEnd={() => setDraggedItem(null)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-3 shrink-0" />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {typeIcons[resource.type]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{resource.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">{resource.category}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{resource.type}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {resource.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                      {resource.url && (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          <ExternalLink className="h-3 w-3" />Open link
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No resources match your search</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Resource Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddResource} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input name="title" required placeholder="e.g., Petzl Harness Manual" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea name="description" rows={2} placeholder="Brief description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select name="category" defaultValue={currentFolder || "Equipment"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(folderStructure).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select name="type" defaultValue="Document">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>URL (optional)</Label>
              <Input name="url" type="url" placeholder="https://..." />
            </div>
            <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" />Upload file
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Folder Dialog */}
      <Dialog open={addFolderOpen} onOpenChange={setAddFolderOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Add Folder</DialogTitle></DialogHeader>
          <form onSubmit={handleAddFolder} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Folder Name</Label>
              <Input name="folderName" required placeholder="e.g., HR Documents" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddFolderOpen(false)}>Cancel</Button>
              <Button type="submit">Create Folder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
