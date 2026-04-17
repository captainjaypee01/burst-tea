import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

/**
 * Tailwind v4: theme tokens live primarily in `src/index.css` (`@theme`).
 * Font families are extended here per design system (Inter + Playfair Display).
 */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
} satisfies Config
