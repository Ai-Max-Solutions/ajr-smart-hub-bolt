import * as React from "react"
import { Eye, EyeOff, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "search" | "password" | "clearable"
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  error?: string
  success?: boolean
  loading?: boolean
  onClear?: () => void
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    type, 
    variant = "default",
    icon,
    iconPosition = "left",
    error,
    success,
    loading,
    onClear,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(props.value || "")
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value)
      props.onChange?.(e)
    }

    const handleClear = () => {
      setInternalValue("")
      onClear?.()
    }

    const inputType = variant === "password" 
      ? (showPassword ? "text" : "password")
      : type

    const hasValue = internalValue && String(internalValue).length > 0

    return (
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              icon
            )}
          </div>
        )}

        {/* Search Icon for search variant */}
        {variant === "search" && !icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            <Search className="h-4 w-4" />
          </div>
        )}

        <Input
          type={inputType}
          className={cn(
            "transition-all duration-200",
            // Left padding for icons
            (icon && iconPosition === "left") || variant === "search" ? "pl-10" : "",
            // Right padding for actions
            variant === "password" || (variant === "clearable" && hasValue) || (icon && iconPosition === "right") ? "pr-10" : "",
            // Error states
            error && "border-destructive focus-visible:ring-destructive",
            // Success states
            success && "border-success focus-visible:ring-success",
            // Enhanced focus styles
            "focus-visible:ring-2 focus-visible:ring-offset-1",
            className
          )}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          {...props}
        />

        {/* Right Side Actions */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear button for clearable variant */}
          {variant === "clearable" && hasValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )}

          {/* Password toggle */}
          {variant === "password" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
          )}

          {/* Right Icon */}
          {icon && iconPosition === "right" && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-destructive font-medium animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }