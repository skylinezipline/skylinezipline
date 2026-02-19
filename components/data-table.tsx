"use client"

import { useState, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchField?: keyof T
  searchPlaceholder?: string
  pageSize?: number
  onRowClick?: (item: T) => void
  actions?: React.ReactNode
  filters?: React.ReactNode
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchField,
  searchPlaceholder = "Search...",
  pageSize = 10,
  onRowClick,
  actions,
  filters,
  emptyMessage = "No results found.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!search || !searchField) return data
    return data.filter((item) => {
      const val = item[searchField]
      if (typeof val === "string") return val.toLowerCase().includes(search.toLowerCase())
      return true
    })
  }, [data, search, searchField])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {searchField && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-64 pl-8 h-9"
            />
          </div>
        )}
        {filters}
        <div className="flex-1" />
        {actions}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item, idx) => (
                <TableRow
                  key={idx}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(item)
                        : String(item[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
