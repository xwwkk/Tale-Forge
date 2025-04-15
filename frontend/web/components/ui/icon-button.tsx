import * as React from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends React.ComponentProps<typeof Button> {
  icon?: React.ReactNode
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("p-0", className)}
        ref={ref}
        {...props}
      >
        {icon}
        {children}
      </Button>
    )
  }
)

IconButton.displayName = "IconButton"

export default IconButton 