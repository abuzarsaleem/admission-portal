type StatusOption = {
  value: string
  label: string
  description: string
}

type StatusRadioGroupProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: StatusOption[]
  error?: string
  required?: boolean
}

export function StatusRadioGroup({ label, value, onChange, options, error, required = true }: StatusRadioGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#071759]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="space-y-3">
        {options.map(option => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                selected ? 'border-[#0c3cff] bg-[#f8faff]' : 'border-[#dce5f6] bg-white hover:border-[#b8c6ed]'
              } ${error ? 'border-red-500' : ''}`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-[#0c3cff]' : 'border-[#b8c6ed]'
                }`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-[#0c3cff]" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#071759]">{option.label}</span>
                <span className="mt-0.5 block text-sm text-[#6374ab]">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
