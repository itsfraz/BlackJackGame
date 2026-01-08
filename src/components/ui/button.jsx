import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Game Variants matching original design exactly
        hit: "bg-gradient-to-br from-green-600 to-green-800 text-white shadow-xl shadow-green-900/50 hover:brightness-110 hover:-translate-y-1 active:scale-95 border-t-2 border-white/10 disabled:opacity-40 disabled:cursor-not-allowed",
        stand: "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-900/50 hover:brightness-110 hover:-translate-y-1 active:scale-95 border-t-2 border-white/10 disabled:opacity-40 disabled:cursor-not-allowed",
        action: "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl shadow-blue-900/50 hover:brightness-110 hover:-translate-y-1 active:scale-95 border-t-2 border-white/10 disabled:opacity-40 disabled:cursor-not-allowed",
        
        // Gold variant (Double Down, Deal)
        gold: "bg-gradient-to-br from-bj-gold to-yellow-600 text-black shadow-xl shadow-yellow-900/50 border-t-2 border-yellow-300 hover:brightness-110 hover:-translate-y-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Custom sizes
        game: "px-6 py-4 rounded-xl font-black text-lg uppercase tracking-widest",
        xl: "px-10 py-5 rounded-xl font-black text-xl uppercase tracking-widest",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
