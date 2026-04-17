import { type ReactElement, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { OrderItem } from '@/types/models'

export type LineNoteInputProps = {
  item: OrderItem
  disabled?: boolean
  onCommit: (notes: string) => void
  /** Inline “Add line note” that expands to an input (POS menu brief). */
  mode?: 'field' | 'ghost'
}

export function LineNoteInput({ item, disabled, onCommit, mode = 'field' }: LineNoteInputProps): ReactElement {
  const [value, setValue] = useState(item.notes ?? '')
  const [open, setOpen] = useState(mode === 'ghost' ? (item.notes?.trim().length ?? 0) > 0 : true)

  useEffect(() => {
    setValue(item.notes ?? '')
    if (mode === 'ghost' && (item.notes?.trim().length ?? 0) > 0) {
      setOpen(true)
    }
  }, [item.id, item.notes, mode])

  if (mode === 'ghost' && !open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-auto px-0 py-1 text-[11px] text-muted-foreground"
        disabled={disabled}
        onClick={() => {
          setOpen(true)
        }}
      >
        Add line note
      </Button>
    )
  }

  return (
    <label className="mt-2 block">
      <span className="sr-only">Line note</span>
      <Input
        placeholder="Line note…"
        value={value}
        disabled={disabled}
        className="h-auto border-border/12 bg-card py-1.5 text-[11px]"
        onChange={(e) => {
          setValue(e.target.value)
        }}
        onBlur={() => {
          onCommit(value)
          if (mode === 'ghost' && value.trim() === '') {
            setOpen(false)
          }
        }}
      />
    </label>
  )
}
