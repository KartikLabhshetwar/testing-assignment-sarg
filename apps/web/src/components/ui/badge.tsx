import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-2 px-3 py-1 text-sm font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "border-black bg-black text-white hover:bg-white hover:text-black",
        secondary:
          "border-gray-300 bg-gray-100 text-black hover:bg-gray-300",
        destructive:
          "border-red-500 bg-red-500 text-white hover:bg-white hover:text-red-500",
        outline: "border-black text-black bg-white hover:bg-black hover:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
