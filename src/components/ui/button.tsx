import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-poppins font-medium ring-offset-background transition-aj duration-aj-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aj-yellow focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-card active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-elevated",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-elevated",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5",
        outline:
          "border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 hover:shadow-elevated",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5 hover:shadow-elevated",
        ghost: "shadow-none hover:bg-accent hover:text-accent-foreground",
        link: "text-accent underline-offset-4 hover:underline shadow-none",
        navy: "bg-aj-navy-deep text-white hover:bg-aj-navy-light hover:-translate-y-0.5 hover:shadow-elevated",
        yellow: "bg-aj-yellow text-aj-navy-deep hover:bg-aj-yellow-bright hover:-translate-y-0.5 hover:shadow-elevated",
      },
      size: {
        default: "h-10 px-4 py-2 text-body",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-11 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
        touch: "h-12 px-6 py-3 text-body min-w-[48px]", // Construction site friendly
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
