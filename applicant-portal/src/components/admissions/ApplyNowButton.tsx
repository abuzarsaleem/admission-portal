import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  size?: 'default' | 'sm'
}

/** Apply is not wired yet — visible CTA only. */
export function ApplyNowButton({ className, size = 'default' }: Props) {
  return (
    <Button
      type="button"
      disabled
      title="Applications will open in a future release"
      className={cn(
        'bg-[#0c3cff] text-white hover:bg-[#0934dc] disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'h-9 px-4' : 'h-11 px-5',
        className,
      )}
    >
      Apply Now
    </Button>
  )
}
