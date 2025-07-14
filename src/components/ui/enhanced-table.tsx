import * as React from "react"
import { ChevronDown, Download, RefreshCw, Settings, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EnhancedInput } from "@/components/ui/enhanced-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AJIcon } from "@/components/ui/aj-icon"

export interface ColumnDef<TData = any> {
  id: string
  header?: string | React.ReactNode
  accessorKey?: keyof TData
  cell?: (props: { value: any; row: TData; index: number }) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  hidden?: boolean
  width?: string | number
  className?: string
}

interface EnhancedTableProps<TData = any> {
  columns: ColumnDef<TData>[]
  data: TData[]
  title?: string
  description?: string
  loading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  onRowClick?: (row: TData, index: number) => void
  enableSelection?: boolean
  enablePagination?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
  pageSize?: number
  className?: string
  emptyMessage?: string
  emptyDescription?: string
  customActions?: React.ReactNode
  selectedRows?: number[]
  onSelectionChange?: (selectedIndexes: number[]) => void
}

export function EnhancedTable<TData = any>({
  columns,
  data,
  title,
  description,
  loading = false,
  onRefresh,
  onExport,
  onRowClick,
  enableSelection = false,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = true,
  pageSize = 10,
  className,
  emptyMessage = "No data available",
  emptyDescription = "No results found. Try adjusting your search or filters.",
  customActions,
  selectedRows = [],
  onSelectionChange
}: EnhancedTableProps<TData>) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortColumn, setSortColumn] = React.useState<string>("")
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [hiddenColumns, setHiddenColumns] = React.useState<Set<string>>(new Set())
  const [internalSelection, setInternalSelection] = React.useState<number[]>(selectedRows)

  // Update internal selection when prop changes
  React.useEffect(() => {
    setInternalSelection(selectedRows)
  }, [selectedRows])

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!enableFiltering || !searchTerm) return data

    return data.filter((row, index) => {
      return columns.some(column => {
        if (!column.filterable) return false
        
        const value = column.accessorKey ? row[column.accessorKey] : ""
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
  }, [data, searchTerm, columns, enableFiltering])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!enableSorting || !sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === sortColumn)
      if (!column?.accessorKey) return 0

      const aValue = a[column.accessorKey]
      const bValue = b[column.accessorKey]

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return sortDirection === "desc" ? -comparison : comparison
    })
  }, [filteredData, sortColumn, sortDirection, columns, enableSorting])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!enablePagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, enablePagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const visibleColumns = columns.filter(col => !hiddenColumns.has(col.id))

  const handleSort = (columnId: string) => {
    if (!enableSorting) return

    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnId)
      setSortDirection("asc")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (!enableSelection) return

    const newSelection = checked ? 
      paginatedData.map((_, index) => (currentPage - 1) * pageSize + index) : 
      []
    
    setInternalSelection(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleRowSelect = (index: number, checked: boolean) => {
    if (!enableSelection) return

    const actualIndex = (currentPage - 1) * pageSize + index
    const newSelection = checked 
      ? [...internalSelection, actualIndex]
      : internalSelection.filter(i => i !== actualIndex)
    
    setInternalSelection(newSelection)
    onSelectionChange?.(newSelection)
  }

  const isAllSelected = enableSelection && 
    paginatedData.length > 0 && 
    paginatedData.every((_, index) => internalSelection.includes((currentPage - 1) * pageSize + index))

  const isSomeSelected = enableSelection && 
    paginatedData.some((_, index) => internalSelection.includes((currentPage - 1) * pageSize + index))

  return (
    <Card className={cn("w-full", className)}>
      {(title || description || enableFiltering || customActions) && (
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4">
            {/* Title and Description */}
            {(title || description) && (
              <div>
                {title && (
                  <CardTitle className="font-poppins text-xl flex items-center gap-3">
                    {title}
                    {data.length > 0 && (
                      <Badge variant="secondary" className="text-sm font-normal">
                        {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}
                      </Badge>
                    )}
                  </CardTitle>
                )}
                {description && (
                  <p className="text-muted-foreground font-poppins mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="flex flex-1 items-center gap-3 max-w-md">
                {enableFiltering && (
                  <EnhancedInput
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page on search
                    }}
                    variant="search"
                    className="w-full"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Selection info */}
                {enableSelection && internalSelection.length > 0 && (
                  <Badge variant="secondary" className="font-poppins">
                    {internalSelection.length} selected
                  </Badge>
                )}

                {/* Custom actions */}
                {customActions}

                {/* Refresh */}
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                    className="font-poppins"
                  >
                    <AJIcon 
                      icon={RefreshCw} 
                      variant="yellow" 
                      size="sm" 
                      hover={false}
                      className={loading ? "animate-spin" : ""}
                    />
                    <span className="hidden sm:inline ml-2">Refresh</span>
                  </Button>
                )}

                {/* Export */}
                {onExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExport}
                    className="font-poppins"
                  >
                    <AJIcon icon={Download} variant="yellow" size="sm" hover={false} />
                    <span className="hidden sm:inline ml-2">Export</span>
                  </Button>
                )}

                {/* Column visibility */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="font-poppins">
                      <AJIcon icon={Settings} variant="yellow" size="sm" hover={false} />
                      <span className="hidden sm:inline ml-2">Columns</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={!hiddenColumns.has(column.id)}
                        onCheckedChange={(checked) => {
                          const newHidden = new Set(hiddenColumns)
                          if (checked) {
                            newHidden.delete(column.id)
                          } else {
                            newHidden.add(column.id)
                          }
                          setHiddenColumns(newHidden)
                        }}
                      >
                        {typeof column.header === "string" ? column.header : column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="font-poppins">Loading...</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  {/* Selection header */}
                  {enableSelection && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        ref={React.useRef<HTMLButtonElement>(null)}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.id}
                      className={cn(
                        "font-poppins font-semibold text-foreground",
                        column.sortable && enableSorting && "cursor-pointer hover:bg-muted/50",
                        column.className
                      )}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center gap-2">
                        {column.header}
                        {column.sortable && enableSorting && sortColumn === column.id && (
                          <div className={cn(
                            "w-4 h-4 transition-transform",
                            sortDirection === "desc" && "rotate-180"
                          )}>
                            ↑
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, rowIndex) => {
                    const actualIndex = (currentPage - 1) * pageSize + rowIndex
                    const isSelected = internalSelection.includes(actualIndex)
                    
                    return (
                      <TableRow
                        key={actualIndex}
                        className={cn(
                          "transition-colors border-b",
                          onRowClick && "cursor-pointer hover:bg-muted/50",
                          isSelected && "bg-muted/30",
                          "animate-fade-in"
                        )}
                        onClick={() => onRowClick?.(row, actualIndex)}
                      >
                        {/* Selection cell */}
                        {enableSelection && (
                          <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleRowSelect(rowIndex, !!checked)}
                              aria-label={`Select row ${rowIndex + 1}`}
                            />
                          </TableCell>
                        )}
                        
                        {visibleColumns.map((column) => (
                          <TableCell 
                            key={column.id} 
                            className={cn("font-poppins", column.className)}
                            style={{ width: column.width }}
                          >
                            {column.cell ? 
                              column.cell({ 
                                value: column.accessorKey ? row[column.accessorKey] : undefined, 
                                row, 
                                index: actualIndex 
                              }) :
                              column.accessorKey ? String(row[column.accessorKey] || "") : ""
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} 
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="p-4 rounded-full bg-muted/30">
                          <MoreHorizontal className="h-8 w-8" />
                        </div>
                        <div>
                          <div className="font-medium text-lg">{emptyMessage}</div>
                          <div className="text-sm mt-1">{emptyDescription}</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {enablePagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground font-poppins">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
              {enableSelection && internalSelection.length > 0 && (
                <span className="ml-4">
                  ({internalSelection.length} selected)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="font-poppins"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1
                  
                  // Adjust page numbers for current position
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10 h-10 p-0 font-poppins"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="font-poppins"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}