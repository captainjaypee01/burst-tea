import { useEffect, useState } from 'react'

/** True when `query` matches (e.g. `(min-width: 1024px)`). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (): void => {
      setMatches(mq.matches)
    }
    mq.addEventListener('change', onChange)
    setMatches(mq.matches)
    return () => {
      mq.removeEventListener('change', onChange)
    }
  }, [query])

  return matches
}
