import ThemeToggle from '../ThemeToggle'
import { ThemeProvider } from '../ThemeProvider'

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-4 bg-background">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}