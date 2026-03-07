"use client"

import { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import {
  Camera, Video, Heart, Check, X, Search, Filter, Instagram, Send, Calendar,
  Plus, Hash, Clock, ImageIcon, Star, Play, ExternalLink, Trash2, Eye,
  TrendingUp, Users, BarChart3, Grip, MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { KPIStatCard } from "@/components/kpi-stat-card"
import { useAppStore } from "@/lib/mock-store"
import { locations } from "@/lib/mock-data"
import type { SiteMedia, UGCPost, ScheduledPost } from "@/lib/types"
import { toast } from "sonner"

function MetricsBar({ mediaCount, ugcCount, scheduledCount, favoritedCount }: {
  mediaCount: number; ugcCount: number; scheduledCount: number; favoritedCount: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KPIStatCard label="Media Library" value={mediaCount} trend="up" trendValue="this month" icon={<Camera className="h-4 w-4" />} />
      <KPIStatCard label="UGC Collected" value={ugcCount} trend="up" trendValue="+8 this week" icon={<Instagram className="h-4 w-4" />} />
      <KPIStatCard label="Scheduled Posts" value={scheduledCount} trendValue="upcoming" icon={<Calendar className="h-4 w-4" />} />
      <KPIStatCard label="Favorited" value={favoritedCount} trendValue="ready to use" icon={<Star className="h-4 w-4" />} />
    </div>
  )
}

// ============================================================
// Media Library Tab
// ============================================================
function MediaLibraryTab({ onUseInPost }: { onUseInPost: (mediaId: string) => void }) {
  const { state, dispatch } = useAppStore()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest")
  const [selectedMedia, setSelectedMedia] = useState<SiteMedia | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const media = useMemo(() => {
    let filtered = state.siteMedia.filter(m => m.locationId === state.selectedLocationId)
    if (typeFilter === "Favorites") filtered = filtered.filter(m => m.favorited)
    else if (typeFilter !== "all") filtered = filtered.filter(m => m.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(m => m.tags.some(t => t.toLowerCase().includes(q)) || (m.guideName?.toLowerCase().includes(q)))
    }
    return filtered.sort((a, b) => dateSort === "newest" ? b.capturedDate.localeCompare(a.capturedDate) : a.capturedDate.localeCompare(b.capturedDate))
  }, [state.siteMedia, state.selectedLocationId, typeFilter, search, dateSort])

  const grouped = useMemo(() => {
    const map = new Map<string, SiteMedia[]>()
    media.forEach(m => { const existing = map.get(m.capturedDate) || []; existing.push(m); map.set(m.capturedDate, existing) })
    return Array.from(map.entries())
  }, [media])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by tag or guide..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 h-9"><Filter className="mr-2 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Photo">Photos</SelectItem>
            <SelectItem value="Video">Videos</SelectItem>
            <SelectItem value="GoPro">GoPro</SelectItem>
            <SelectItem value="Favorites">Favorites</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateSort} onValueChange={v => setDateSort(v as "newest" | "oldest")}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Camera className="mb-3 h-10 w-10" /><p>No media found</p></CardContent></Card>
      ) : grouped.map(([date, items]) => (
        <div key={date}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{format(parseISO(date), "EEEE, MMM d, yyyy")} <span className="font-normal">({items.length})</span></h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map(item => (
              <div
                key={item.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg border bg-muted aspect-[4/3]"
                onClick={() => setSelectedMedia(item)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnailUrl} alt={item.tags.join(", ")} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {/* Type badge */}
                <div className="absolute left-2 top-2">
                  {item.type === "Video" && <Badge className="bg-chart-5/90 text-white border-0 text-[10px]"><Play className="mr-1 h-2.5 w-2.5" />Video</Badge>}
                  {item.type === "GoPro" && <Badge className="bg-chart-3/90 text-white border-0 text-[10px]"><Video className="mr-1 h-2.5 w-2.5" />GoPro</Badge>}
                </div>
                {/* Favorite - always visible if favorited, or on hover */}
                <button
                  className={`absolute right-2 top-2 rounded-full p-1.5 transition-opacity ${
                    item.favorited ? "bg-red-500/80 opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"
                  }`}
                  onClick={e => { e.stopPropagation(); dispatch({ type: "TOGGLE_MEDIA_FAVORITE", id: item.id }) }}
                >
                  <Heart className={`h-3.5 w-3.5 ${item.favorited ? "fill-white text-white" : "text-white"}`} />
                </button>
                {/* Video play preview indicator on hover */}
                {(item.type === "Video" || item.type === "GoPro") && hoveredId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50"><Play className="h-5 w-5 text-white fill-white" /></div>
                  </div>
                )}
                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-[10px] text-white/80 truncate">{item.tourSlotTime && `${item.tourSlotTime} tour`}{item.guideName && ` - ${item.guideName}`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Media Detail Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMedia && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedMedia.type === "Photo" && <ImageIcon className="h-4 w-4" />}
                  {selectedMedia.type === "Video" && <Play className="h-4 w-4" />}
                  {selectedMedia.type === "GoPro" && <Video className="h-4 w-4" />}
                  {selectedMedia.type} - {format(parseISO(selectedMedia.capturedDate), "MMM d, yyyy")}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedMedia.url} alt={selectedMedia.tags.join(", ")} className="w-full rounded-lg" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{selectedMedia.type}</Badge>
                {selectedMedia.tourSlotTime && <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />{selectedMedia.tourSlotTime}</Badge>}
                {selectedMedia.guideName && <Badge variant="outline">{selectedMedia.guideName}</Badge>}
                {selectedMedia.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>
              <div className="flex gap-2">
                <Button variant={selectedMedia.favorited ? "default" : "outline"} size="sm" onClick={() => dispatch({ type: "TOGGLE_MEDIA_FAVORITE", id: selectedMedia.id })}>
                  <Heart className={`mr-1 h-3.5 w-3.5 ${selectedMedia.favorited ? "fill-current" : ""}`} />
                  {selectedMedia.favorited ? "Favorited" : "Favorite"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { onUseInPost(selectedMedia.id); setSelectedMedia(null) }}>
                  <Send className="mr-1 h-3.5 w-3.5" />Use in Post
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// UGC / Tagged Content Tab
// ============================================================
function UGCTab() {
  const { state, dispatch } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  const posts = useMemo(() => {
    let filtered = state.ugcPosts.filter(p => p.locationId === state.selectedLocationId)
    if (statusFilter !== "all") filtered = filtered.filter(p => p.status === statusFilter)
    if (platformFilter !== "all") filtered = filtered.filter(p => p.platform === platformFilter)
    return filtered.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  }, [state.ugcPosts, state.selectedLocationId, statusFilter, platformFilter])

  const pendingCount = state.ugcPosts.filter(p => p.locationId === state.selectedLocationId && p.status === "Pending").length

  function platformIcon(platform: string) {
    if (platform === "Instagram") return <Instagram className="h-3.5 w-3.5" />
    if (platform === "TikTok") return <Play className="h-3.5 w-3.5" />
    return <Star className="h-3.5 w-3.5" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Pending">Pending ({pendingCount})</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Platforms</SelectItem><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="TikTok">TikTok</SelectItem><SelectItem value="Google Review">Google</SelectItem></SelectContent>
          </Select>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="mr-1 h-3.5 w-3.5" />Add UGC Manually</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add User-Generated Content</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <Input placeholder="Instagram/TikTok URL or paste content link" />
              <Select><SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger><SelectContent><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="TikTok">TikTok</SelectItem><SelectItem value="Google Review">Google Review</SelectItem></SelectContent></Select>
              <Input placeholder="Username" />
              <Textarea placeholder="Caption / review text" rows={3} />
              <Button onClick={() => toast.success("UGC added to library")}>Add to Library</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Instagram className="mb-3 h-10 w-10" /><p>No tagged content found</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <Card key={post.id} className="overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.mediaUrl} alt={post.caption} className="h-full w-full object-cover" />
                <div className="absolute left-2 top-2 flex items-center gap-1.5"><Badge className="border-0 bg-black/60 text-white text-[10px]">{platformIcon(post.platform)}<span className="ml-1">{post.platform}</span></Badge></div>
                <div className="absolute right-2 top-2"><StatusBadge status={post.status} /></div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.avatarUrl} alt={post.username} className="h-7 w-7 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">@{post.username}</p><p className="text-[10px] text-muted-foreground">{format(parseISO(post.postedAt), "MMM d, yyyy")}</p></div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{post.likes}</span><span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{post.comments}</span></div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.caption}</p>
                <div className="flex gap-2">
                  {post.status === "Pending" && (
                    <>
                      <Button size="sm" variant="default" className="flex-1 h-7 text-xs" onClick={() => { dispatch({ type: "UPDATE_UGC_STATUS", id: post.id, status: "Approved" }); toast.success("Approved") }}><Check className="mr-1 h-3 w-3" />Approve</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => dispatch({ type: "UPDATE_UGC_STATUS", id: post.id, status: "Rejected" })}><X className="h-3 w-3" /></Button>
                    </>
                  )}
                  {post.status === "Approved" && <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => toast.success("Added to post draft")}><Send className="mr-1 h-3 w-3" />Use in Post</Button>}
                  {post.status === "Rejected" && <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-muted-foreground" onClick={() => dispatch({ type: "UPDATE_UGC_STATUS", id: post.id, status: "Pending" })}>Undo Rejection</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Create Post Tab
// ============================================================
function CreatePostTab({ preselectedMediaIds, onClearPreselected }: { preselectedMediaIds: string[]; onClearPreselected: () => void }) {
  const { state, dispatch } = useAppStore()
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("#zipline #adventure")
  const [platform, setPlatform] = useState<string>("Instagram")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("10:00")
  const [selectedImages, setSelectedImages] = useState<string[]>(preselectedMediaIds)

  // Merge preselected when they change
  if (preselectedMediaIds.length > 0 && !selectedImages.some(id => preselectedMediaIds.includes(id))) {
    setSelectedImages(prev => [...new Set([...prev, ...preselectedMediaIds])])
    onClearPreselected()
  }

  const allMedia = state.siteMedia.filter(m => m.locationId === state.selectedLocationId)
  const favorited = allMedia.filter(m => m.favorited)
  const approved = state.ugcPosts.filter(p => p.locationId === state.selectedLocationId && p.status === "Approved")

  function handleCreate(asDraft: boolean) {
    if (!caption.trim()) { toast.error("Caption is required"); return }
    const newPost: ScheduledPost = {
      id: `sp-${Date.now()}`, platform: platform as ScheduledPost["platform"], mediaIds: selectedImages,
      caption, hashtags: hashtags.split(/\s+/).filter(Boolean),
      scheduledDate: scheduleDate || "2026-02-14", scheduledTime: scheduleTime,
      status: asDraft ? "Draft" : "Scheduled", createdAt: "2026-02-14",
    }
    dispatch({ type: "ADD_SCHEDULED_POST", post: newPost })
    toast.success(asDraft ? "Saved as draft" : "Post scheduled!")
    setCaption(""); setSelectedImages([])
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Compose Post</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">Platform</span>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="Facebook">Facebook</SelectItem><SelectItem value="TikTok">TikTok</SelectItem><SelectItem value="All">All Platforms</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-sm text-muted-foreground mb-2 block">Selected Media ({selectedImages.length})</span>
              {selectedImages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map(id => {
                    const m = state.siteMedia.find(sm => sm.id === id); const u = state.ugcPosts.find(up => up.id === id)
                    const url = m?.thumbnailUrl || u?.mediaUrl || ""
                    return (
                      <div key={id} className="relative h-20 w-20 rounded-md overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5" onClick={() => setSelectedImages(prev => prev.filter(i => i !== id))}><X className="h-3 w-3 text-white" /></button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">Select images from the panels on the right</div>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Caption</span>
              <Textarea placeholder="Write your caption here..." value={caption} onChange={e => setCaption(e.target.value)} rows={4} className="text-sm" />
              <p className="mt-1 text-xs text-muted-foreground text-right">{caption.length}/2200</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Hash className="h-3.5 w-3.5" />Hashtags</span>
              <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#zipline #adventure" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground w-20">Schedule</span>
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-40 h-9" />
              <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-28 h-9" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => handleCreate(false)} className="flex-1"><Calendar className="mr-1 h-4 w-4" />Schedule Post</Button>
              <Button variant="outline" onClick={() => handleCreate(true)}>Save Draft</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-4">
        {/* All Media */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Camera className="h-3.5 w-3.5" />All Media</CardTitle></CardHeader>
          <CardContent>
            {allMedia.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No media yet.</p> : (
              <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                {allMedia.slice(0, 24).map(m => (
                  <button key={m.id} className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${selectedImages.includes(m.id) ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/30"}`}
                    onClick={() => setSelectedImages(prev => prev.includes(m.id) ? prev.filter(i => i !== m.id) : [...prev, m.id])}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    {selectedImages.includes(m.id) && <div className="absolute inset-0 flex items-center justify-center bg-primary/20"><Check className="h-5 w-5 text-primary" /></div>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorited Media */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-3.5 w-3.5" />Favorited Media</CardTitle></CardHeader>
          <CardContent>
            {favorited.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No favorited media yet.</p> : (
              <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                {favorited.map(m => (
                  <button key={m.id} className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${selectedImages.includes(m.id) ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/30"}`}
                    onClick={() => setSelectedImages(prev => prev.includes(m.id) ? prev.filter(i => i !== m.id) : [...prev, m.id])}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    {selectedImages.includes(m.id) && <div className="absolute inset-0 flex items-center justify-center bg-primary/20"><Check className="h-5 w-5 text-primary" /></div>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved UGC */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Instagram className="h-3.5 w-3.5" />Approved UGC</CardTitle></CardHeader>
          <CardContent>
            {approved.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No approved UGC yet.</p> : (
              <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                {approved.map(p => (
                  <button key={p.id} className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${selectedImages.includes(p.id) ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/30"}`}
                    onClick={() => setSelectedImages(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id])}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.mediaUrl} alt="" className="h-full w-full object-cover" />
                    {selectedImages.includes(p.id) && <div className="absolute inset-0 flex items-center justify-center bg-primary/20"><Check className="h-5 w-5 text-primary" /></div>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Scheduled Queue Tab
// ============================================================
function ScheduledQueueTab() {
  const { state, dispatch } = useAppStore()
  const [filter, setFilter] = useState<string>("all")

  // Filter by location - show all posts but add location tag
  const posts = useMemo(() => {
    let list = state.scheduledPosts
    if (filter !== "all") list = list.filter(p => p.status === filter)
    return list.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime))
  }, [state.scheduledPosts, filter])

  // Determine which location a post belongs to based on its media
  const getPostLocation = (post: ScheduledPost) => {
    for (const id of post.mediaIds) {
      const m = state.siteMedia.find(sm => sm.id === id)
      if (m) return locations.find(l => l.id === m.locationId)?.name
    }
    return locations.find(l => l.id === state.selectedLocationId)?.name
  }

  function platformIcon(p: string) {
    if (p === "Instagram") return <Instagram className="h-3.5 w-3.5" />
    if (p === "TikTok") return <Play className="h-3.5 w-3.5" />
    if (p === "All") return <Grip className="h-3.5 w-3.5" />
    return <ExternalLink className="h-3.5 w-3.5" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Draft">Drafts</SelectItem><SelectItem value="Scheduled">Scheduled</SelectItem><SelectItem value="Published">Published</SelectItem></SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
      </div>

      {posts.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Calendar className="mb-3 h-10 w-10" /><p>No scheduled posts yet.</p></CardContent></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const locName = getPostLocation(post)
            return (
              <Card key={post.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex flex-col items-center text-center min-w-[60px]">
                    <span className="text-2xl font-bold">{format(parseISO(post.scheduledDate), "d")}</span>
                    <span className="text-xs text-muted-foreground">{format(parseISO(post.scheduledDate), "MMM")}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{post.scheduledTime}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] flex items-center gap-1">{platformIcon(post.platform)}{post.platform}</Badge>
                      <StatusBadge status={post.status} />
                      {locName && <Badge variant="secondary" className="text-[10px] flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{locName}</Badge>}
                    </div>
                    <p className="text-sm line-clamp-2">{post.caption}</p>
                    {post.hashtags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 5).map(h => <span key={h} className="text-[10px] text-primary">{h}</span>)}
                      </div>
                    )}
                    {post.mediaIds.length > 0 && (
                      <div className="mt-2 flex gap-1.5">
                        {post.mediaIds.slice(0, 4).map(id => {
                          const m = state.siteMedia.find(sm => sm.id === id); const u = state.ugcPosts.find(up => up.id === id)
                          const url = m?.thumbnailUrl || u?.mediaUrl || ""
                          return url ? <div key={id} className="h-10 w-10 rounded overflow-hidden border">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" className="h-full w-full object-cover" /></div> : null
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {post.status === "Draft" && <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => dispatch({ type: "UPDATE_SCHEDULED_POST", id: post.id, updates: { status: "Scheduled" } })}><Calendar className="mr-1 h-3 w-3" />Schedule</Button>}
                    {post.status === "Scheduled" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { dispatch({ type: "UPDATE_SCHEDULED_POST", id: post.id, updates: { status: "Published" } }); toast.success("Published") }}><Check className="mr-1 h-3 w-3" />Publish</Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => dispatch({ type: "DELETE_SCHEDULED_POST", id: post.id })}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================
export default function ContentHubPage() {
  const { state } = useAppStore()
  const location = locations.find(l => l.id === state.selectedLocationId)!
  const [activeTab, setActiveTab] = useState("library")
  const [preselectedMedia, setPreselectedMedia] = useState<string[]>([])

  const mediaCount = state.siteMedia.filter(m => m.locationId === state.selectedLocationId).length
  const ugcCount = state.ugcPosts.filter(p => p.locationId === state.selectedLocationId).length
  const scheduledCount = state.scheduledPosts.filter(p => p.status === "Scheduled").length
  const favoritedCount = state.siteMedia.filter(m => m.locationId === state.selectedLocationId && m.favorited).length

  const handleUseInPost = (mediaId: string) => {
    setPreselectedMedia([mediaId])
    setActiveTab("compose")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Hub</h1>
        <p className="text-muted-foreground">Media library, tagged content, and social post scheduling for {location.name}</p>
      </div>

      <MetricsBar mediaCount={mediaCount} ugcCount={ugcCount} scheduledCount={scheduledCount} favoritedCount={favoritedCount} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="library" className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" />Media Library</TabsTrigger>
          <TabsTrigger value="ugc" className="flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" />Tagged / UGC</TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5" />Compose</TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Queue</TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="mt-4"><MediaLibraryTab onUseInPost={handleUseInPost} /></TabsContent>
        <TabsContent value="ugc" className="mt-4"><UGCTab /></TabsContent>
        <TabsContent value="compose" className="mt-4"><CreatePostTab preselectedMediaIds={preselectedMedia} onClearPreselected={() => setPreselectedMedia([])} /></TabsContent>
        <TabsContent value="queue" className="mt-4"><ScheduledQueueTab /></TabsContent>
      </Tabs>
    </div>
  )
}
