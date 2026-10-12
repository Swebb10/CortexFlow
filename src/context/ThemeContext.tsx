import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readStorage, writeStorage } from '../lib/storage'

export const themes = [
  { id: 'dark', name: 'Dark', description: 'Oscuro y esencial', swatches: ['#101521', '#8b7aff', '#69b9ff'] },
  { id: 'light', name: 'Light', description: 'Claridad para tus ideas', swatches: ['#f3f5fa', '#6150cd', '#225fbd'] },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Una dosis de neón', swatches: ['#080b12', '#f55ce6', '#39f4df'] },
  { id: 'nordic', name: 'Nordic', description: 'Calma en tonos fríos', swatches: ['#242e3b', '#98b8dd', '#9cdbce'] },
  { id: 'sunset', name: 'Sunset', description: 'Enfoque a fuego lento', swatches: ['#241916', '#ffb36b', '#e28b79'] },
] as const
export type Theme = typeof themes[number]['id']
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void }
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readStorage('cortexflow:theme')
    return themes.some((entry) => entry.id === saved) ? saved as Theme : 'dark'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark'
    writeStorage('cortexflow:theme', theme)
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}
