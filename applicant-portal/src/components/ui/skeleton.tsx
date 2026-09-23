import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-[#e4e9f4]', className)} {...props} />
}

export { Skeleton }
