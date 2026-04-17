import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type SearchableSelectOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className,
}: SearchableSelectProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [width, setWidth] = React.useState<number>()

  const labelByValue = React.useMemo(() => {
    const m = new Map<string, string>()
    for (const o of options) {
      m.set(o.value, o.label)
    }
    return m
  }, [options])

  const display =
    value !== '' && labelByValue.has(value) ? (
      <span className="truncate">{labelByValue.get(value)}</span>
    ) : (
      <span className="truncate text-muted">{placeholder}</span>
    )

  React.useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth)
    }
  }, [open, options])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next && triggerRef.current) {
          setWidth(triggerRef.current.offsetWidth)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between border-border bg-card px-3 py-2 text-sm font-normal shadow-sm hover:bg-card',
            !value && 'text-muted',
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center text-start">{display}</span>
          <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={width ? { width } : undefined}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onValueChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('me-2 size-4 shrink-0', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
