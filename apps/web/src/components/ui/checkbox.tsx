'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer size-5 shrink-0 rounded-md border-[1.5px] border-[rgba(28,20,16,0.15)] bg-white',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f18840]/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-[#f18840] data-[state=checked]:bg-[#f18840] data-[state=checked]:text-white',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
