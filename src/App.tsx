import { Switch, Route, Link } from "wouter"
import { queryClient } from "./lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

import HeroSection from "@/components/HeroSection"
import TrajectoryViewer from "@/components/TrajectoryViewer"

import NotFound from "@/pages/not-found"
import AboutPage from "@/pages/about"

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/trajectory" component={TrajectoryPage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function HomePage() {
  return <HeroSection />
}

function TrajectoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Trajectory Planning</h1>
        <p className="text-muted-foreground">
          Advanced 3D trajectory visualization and orbital mechanics calculations
        </p>
      </div>
      <TrajectoryViewer />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
            <Link href="/" data-testid="link-home" className="outline-none">
              <div className="cursor-pointer select-none">
                <h2 className="text-xl font-bold text-space-blue">ODIN</h2>
                <p className="text-sm text-muted-foreground">Mission Control System</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/about" className="text-sm font-mono text-muted-foreground hover:text-white transition-colors">
                [ABOUT PROJECT]
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="pt-20">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
