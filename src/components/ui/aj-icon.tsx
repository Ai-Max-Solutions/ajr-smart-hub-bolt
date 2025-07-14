import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AJIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  variant?: "yellow" | "white" | "navy" | "muted"
  size?: "sm" | "default" | "lg" | "xl"
  hover?: boolean
}

const AJIcon = React.forwardRef<HTMLDivElement, AJIconProps>(
  ({ className, icon: Icon, variant = "white", size = "default", hover = true, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      default: "w-6 h-6", // 24px as specified
      lg: "w-8 h-8",
      xl: "w-10 h-10"
    }

    const variantClasses = {
      yellow: "text-aj-yellow",
      white: "text-white",
      navy: "text-aj-navy-deep",
      muted: "text-muted-foreground"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          sizeClasses[size],
          variantClasses[variant],
          hover && "transition-aj duration-aj-smooth hover:scale-110 hover:brightness-110",
          "aj-icon",
          className
        )}
        {...props}
      >
        <Icon className="w-full h-full" />
      </div>
    )
  }
)
AJIcon.displayName = "AJIcon"

export { AJIcon }