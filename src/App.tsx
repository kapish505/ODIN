import { useEffect, useState } from "react"
import { Switch, Route, useLocation, Link } from "wouter"
import { queryClient } from "./lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import { ThemeProvider } from "@/components/ThemeProvider"
import ThemeToggle from "@/components/ThemeToggle"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import AppSidebar from "@/components/AppSidebar"
import HeroSection from "@/components/HeroSection"
import MissionDashboard from "@/components/MissionDashboard"
import TrajectoryViewer from "@/components/TrajectoryViewer"
import ThreatMonitor from "@/components/ThreatMonitor"
import DecisionLog from "@/components/DecisionLog"


import NotFound from "@/pages/not-found"

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/trajectory" component={TrajectoryPage} />
      <Route path="/threats" component={ThreatsPage} />
      <Route path="/decisions" component={DecisionsPage} />
      <Route path="/decisions" component={DecisionsPage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function HomePage() {
  return <HeroSection />
}

function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Mission Control Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor active missions, system status, and operational metrics
        </p>
      </div>
      <MissionDashboard />
    </div>
  )
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

function ThreatsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Threat Detection System</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of solar activity, space debris, and radiation exposure
        </p>
      </div>
      <ThreatMonitor />
    </div>
  )
}

function DecisionsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">AI Decision Analysis</h1>
        <p className="text-muted-foreground">
          Review AI-generated trajectory decisions and optimization recommendations
        </p>
      </div>
      <DecisionLog />
    </div>
  )
}



export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [pathname] = useLocation()

  // Auto-exit landing when navigating to any route
  useEffect(() => {
    if (pathname !== "/" && showLanding) {
      setShowLanding(false)
    }
  }, [pathname, showLanding])

  // ODIN system sidebar width configuration
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  }

  if (showLanding) {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              {/* Landing Header */}
              <header className="fixed top-0 right-0 z-50 p-4">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </header>

              {/* Hero Section */}
              <HeroSection />

              {/* Enter System Button */}
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                <button
                  onClick={() => {
                    setShowLanding(false)
                    console.log('Entering ODIN mission control system')
                  }}
                  className="bg-mission-orange hover:bg-mission-orange/90 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all active-elevate-2"
                  data-testid="button-enter-system"
                >
                  Enter Mission Control
                </button>
              </div>
            </div>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full bg-background">
              <AppSidebar />

              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <Link href="/" data-testid="link-home" className="outline-none">
                      <div className="cursor-pointer select-none">
                        <h2 className="text-xl font-bold text-space-blue">ODIN</h2>
                        <p className="text-sm text-muted-foreground">Mission Control System</p>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>


              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
