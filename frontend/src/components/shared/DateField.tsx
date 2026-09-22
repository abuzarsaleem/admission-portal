import { Input } from '@/components/ui/input'

type DateFieldProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

export function DateField({ value, onChange, onBlur, error }: DateFieldProps) {
  return (
    <div>
      <Input
        type="date"
        value={value}
        onChange={event => onChange(event.target.value)}
        onBlur={onBlur}
        className={`h-10 border-[#b8c6ed] bg-white px-3 text-[#071759] [color-scheme:light] [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0 ${!value ? '[&::-webkit-datetime-edit]:text-[#9aa8c9]' : ''} ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
