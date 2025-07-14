import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface EnhancedSelectProps {
  options: SelectOption[]
  value?: string | string[]
  onValueChange: (value: string | string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  error?: string
  className?: string
  emptyMessage?: string
  maxSelectedDisplay?: number
}

export function EnhancedSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  multiple = false,
  searchable = true,
  clearable = false,
  disabled = false,
  error,
  className,
  emptyMessage = "No options found",
  maxSelectedDisplay = 3
}: EnhancedSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedValues = multiple 
    ? (Array.isArray(value) ? value : [])
    : (value ? [String(value)] : [])

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(selectedValue)
        ? selectedValues.filter(v => v !== selectedValue)
        : [...selectedValues, selectedValue]
      onValueChange(newValues)
    } else {
      onValueChange(selectedValue)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(multiple ? [] : "")
  }

  const getDisplayValue = () => {
    if (selectedValues.length === 0) return placeholder

    if (!multiple) {
      const option = options.find(opt => opt.value === selectedValues[0])
      return option?.label || selectedValues[0]
    }

    if (selectedValues.length <= maxSelectedDisplay) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val) => {
            const option = options.find(opt => opt.value === val)
            return (
              <Badge key={val} variant="secondary" className="text-xs">
                {option?.label || val}
                <X 
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(val)
                  }}
                />
              </Badge>
            )
          })}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {selectedValues.length} selected
        </Badge>
        {clearable && (
          <X 
            className="h-4 w-4 cursor-pointer hover:text-destructive" 
            onClick={handleClear}
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-auto min-h-[48px] px-3 py-2",
              selectedValues.length === 0 && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
              "hover:bg-accent/50 transition-colors"
            )}
          >
            <div className="flex-1 text-left overflow-hidden">
              {getDisplayValue()}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {clearable && selectedValues.length > 0 && !multiple && (
                <X 
                  className="h-4 w-4 cursor-pointer hover:text-destructive" 
                  onClick={handleClear}
                />
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
          <Command className="w-full">
            {searchable && (
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput 
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors",
                      "hover:bg-accent/50 aria-selected:bg-accent",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {option.icon && (
                        <div className="text-muted-foreground">
                          {option.icon}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedValues.includes(option.value) 
                          ? "opacity-100 text-primary" 
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="mt-1 text-sm text-destructive font-medium animate-fade-in">
          {error}
        </p>
      )}
    </div>
  )
}