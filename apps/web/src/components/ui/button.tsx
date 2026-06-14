import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold text-sm rounded-xl select-none transition-all disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'text-white bg-[#f18840] [box-shadow:0_4px_16px_rgba(241,136,64,0.33)] hover:opacity-[0.92] active:scale-[0.97]',
        secondary:
          'text-[#f18840] bg-[#fff6ee] border-[1.5px] border-[rgba(241,136,64,0.22)] hover:bg-[#fff0e0] hover:border-[rgba(241,136,64,0.35)]',
        ghost:
          'text-[#1c1410]/70 bg-transparent hover:bg-[#1c1410]/5',
        destructive:
          'text-[#f43f5e] bg-transparent hover:bg-[#f43f5e]/5 active:scale-[0.97]',
        link:
          'text-[#f18840] underline underline-offset-2 hover:text-[#e07030] p-0 h-auto',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs min-h-[36px]',
        md: 'px-5 py-2.5 text-sm min-h-[44px]',
        lg: 'px-6 py-3 text-base min-h-[52px]',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

/**
 * shadcn/ui パターンの Button。
 * asChild で任意要素をボタンとしてレンダリング可能（Radix Slot）。
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span>処理中...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
