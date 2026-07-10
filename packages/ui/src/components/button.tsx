import type { ComponentProps } from "react"

import { cn } from "@devlog/ui/lib/utils"

const variantStyles = {
  default: "bg-primary text-primary-foreground hover:bg-primary/85",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  outline: "border bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-white hover:bg-destructive/85",
  link: "text-foreground underline-offset-4 hover:underline",
} as const

const sizeStyles = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs [&_svg]:size-4",
  default: "h-9 gap-2 rounded-lg px-4 text-sm [&_svg]:size-4",
  lg: "h-10 gap-2 rounded-lg px-5 text-sm [&_svg]:size-5",
  icon: "size-9 rounded-lg [&_svg]:size-4",
} as const

export type ButtonVariant = keyof typeof variantStyles
export type ButtonSize = keyof typeof sizeStyles

export interface ButtonProps extends ComponentProps<"button"> {
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex origin-center shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] outline-none active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      data-slot="button"
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
    </button>
  )
}
