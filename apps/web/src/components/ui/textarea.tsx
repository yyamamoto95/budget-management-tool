import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex w-full rounded-xl border border-[rgba(28,20,16,0.08)] bg-white px-4 py-2.5 text-sm text-[#1c1410]',
        'min-h-[88px] resize-y',
        'placeholder:text-[#1c1410]/40',
        'transition-colors',
        'focus:outline-none focus:border-[#f18840] focus:bg-[#fff6ee]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
