import { Input } from '@/components/ui/input'

type FieldProps = {
  label: string
  value: string
  setValue: (value: string) => void
  error?: string
  placeholder: string
  optional?: boolean
}

export function Field({ label, value, setValue, error, placeholder, optional = false }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">
        {label}
        {!optional && <span className="text-red-500"> *</span>}
      </label>
      <Input
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder={placeholder}
        className={`h-10 border-[#b8c6ed] ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
