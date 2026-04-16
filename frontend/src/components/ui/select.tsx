import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type SelectContextValue = {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  open: boolean
  setOpen: (open: boolean) => void
  placeholder: string
  setPlaceholder: (p: string) => void
  labels: Map<string, string>
  registerItem: (value: string, label: string) => void
  unregisterItem: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(component: string): SelectContextValue {
  const ctx = React.useContext(SelectContext)
  if (!ctx) {
    throw new Error(`${component} must be used within <Select>`)
  }
  return ctx
}

type SelectProps = {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function Select({ value, onValueChange, disabled = false, children }: SelectProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const [placeholder, setPlaceholder] = React.useState('')
  const [labels, setLabels] = React.useState(() => new Map<string, string>())
  const rootRef = React.useRef<HTMLDivElement>(null)

  const registerItem = React.useCallback((itemValue: string, label: string) => {
    setLabels((prev) => {
      if (prev.get(itemValue) === label) {
        return prev
      }
      const next = new Map(prev)
      next.set(itemValue, label)
      return next
    })
  }, [])

  const unregisterItem = React.useCallback((itemValue: string) => {
    setLabels((prev) => {
      if (!prev.has(itemValue)) {
        return prev
      }
      const next = new Map(prev)
      next.delete(itemValue)
      return next
    })
  }, [])

  React.useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent): void => {
      const el = rootRef.current
      if (!el || el.contains(event.target as Node)) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange,
      disabled,
      open,
      setOpen,
      placeholder,
      setPlaceholder,
      labels,
      registerItem,
      unregisterItem,
    }),
    [value, onValueChange, disabled, open, placeholder, labels, registerItem, unregisterItem],
  )

  return (
    <SelectContext.Provider value={ctx}>
      <div ref={rootRef} className="relative w-full max-w-md">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div role="group" className={cn(className)} {...props} />
}

type SelectValueProps = {
  placeholder?: string
}

function SelectValue({ placeholder }: SelectValueProps): null {
  const { setPlaceholder } = useSelectContext('SelectValue')
  React.useEffect(() => {
    setPlaceholder(placeholder ?? '')
  }, [placeholder, setPlaceholder])
  return null
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, type = 'button', ...props }, ref) => {
    const ctx = useSelectContext('SelectTrigger')
    const display =
      ctx.value != null && ctx.value !== '' && ctx.labels.has(ctx.value) ? (
        <span className="truncate">{ctx.labels.get(ctx.value)}</span>
      ) : (
        <span className="truncate text-muted">{ctx.placeholder || 'Select…'}</span>
      )

    return (
      <button
        ref={ref}
        type={type}
        role="combobox"
        aria-expanded={ctx.open}
        aria-haspopup="listbox"
        disabled={ctx.disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-[color,box-shadow]',
          'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        onClick={() => {
          if (!ctx.disabled) {
            ctx.setOpen(!ctx.open)
          }
        }}
        {...props}
      >
        <span className="flex min-w-0 flex-1 items-center text-start [&>span]:line-clamp-1">
          {display}
        </span>
        <span className="hidden">{children}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </button>
    )
  },
)
SelectTrigger.displayName = 'SelectTrigger'

type SelectContentProps = React.HTMLAttributes<HTMLDivElement> & {
  position?: 'popper' | 'item-aligned'
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position, ...props }, ref) => {
    void position
    const ctx = useSelectContext('SelectContent')
    // Keep items mounted when closed so SelectItem labels stay registered for the trigger display.
    // (Returning null unmounted items and cleared the label map on every close.)
    return (
      <div
        ref={ref}
        role="listbox"
        aria-hidden={!ctx.open}
        className={cn(
          'absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-card py-1 text-foreground shadow-md',
          !ctx.open && 'hidden',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
SelectContent.displayName = 'SelectContent'

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1.5 text-xs font-medium text-muted', className)} {...props} />
  ),
)
SelectLabel.displayName = 'SelectLabel'

type SelectItemProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> & {
  value: string
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, disabled, type = 'button', onClick: onClickProp, onPointerDown: onPointerDownProp, ...props }, ref) => {
    const ctx = useSelectContext('SelectItem')
    const { registerItem, unregisterItem } = ctx
    const labelText = typeof children === 'string' || typeof children === 'number' ? String(children) : value

    React.useLayoutEffect(() => {
      registerItem(value, labelText)
      return () => {
        unregisterItem(value)
      }
    }, [registerItem, unregisterItem, value, labelText])

    const selected = ctx.value === value

    return (
      <button
        ref={ref}
        type={type}
        role="option"
        aria-selected={selected}
        disabled={disabled}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-start text-sm outline-none',
          'focus:bg-muted-bg focus:text-foreground disabled:pointer-events-none disabled:opacity-50',
          selected && 'bg-muted-bg/80',
          className,
        )}
        {...props}
        onPointerDown={(e) => {
          onPointerDownProp?.(e)
          // Avoid document-level outside-dismiss racing this click (closes before select runs).
          e.stopPropagation()
        }}
        onClick={(e) => {
          onClickProp?.(e)
          e.stopPropagation()
          if (!disabled) {
            ctx.onValueChange(value)
            ctx.setOpen(false)
          }
        }}
      >
        <span className="absolute right-2 flex size-3.5 items-center justify-center">
          {selected ? <Check className="size-4 text-accent" aria-hidden /> : null}
        </span>
        <span className="block truncate pr-6">{children}</span>
      </button>
    )
  },
)
SelectItem.displayName = 'SelectItem'

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} role="separator" className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />,
)
SelectSeparator.displayName = 'SelectSeparator'

const SelectScrollUpButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} className="hidden" {...props} />
))
SelectScrollUpButton.displayName = 'SelectScrollUpButton'

const SelectScrollDownButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} className="hidden" {...props} />
))
SelectScrollDownButton.displayName = 'SelectScrollDownButton'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
