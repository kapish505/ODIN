import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Shield, Brain, Globe } from "lucide-react"
import { useLocation } from "wouter"
import earthImage from "@assets/generated_images/Earth_from_space_backdrop_d272d337.png"

export default function HeroSection() {
  const [, setLocation] = useLocation()

  const handleGetStarted = () => {
    setLocation("/autopilot")
  }

  const handleViewDemo = () => {
    setLocation("/dashboard")
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${earthImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <Badge variant="outline" className="bg-mission-orange/20 text-mission-orange border-mission-orange">
              <Rocket className="w-4 h-4 mr-2" />
              Advanced Mission Planning
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight">
              ODIN
            </h1>
            <h2 className="text-2xl lg:text-4xl font-semibold text-lunar-silver">
              Optimal Dynamic Interplanetary Navigator
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              AI-powered spacecraft trajectory planning system for autonomous Earth-to-Moon missions
              with real-time threat detection and intelligent decision-making capabilities.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-mission-orange hover:bg-mission-orange/90 text-white px-8 py-3"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Launch Mission Planning
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3"
              onClick={handleViewDemo}
              data-testid="button-view-demo"
            >
              View System Demo
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover-elevate">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-mission-orange mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Real-time Threat Detection</h3>
                <p className="text-white/70">Monitor solar flares, space debris, and radiation exposure</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover-elevate">
              <CardContent className="p-6 text-center">
                <Brain className="w-8 h-8 text-mission-orange mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Decision Engine</h3>
                <p className="text-white/70">Intelligent trajectory optimization with natural language explanations</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover-elevate">
              <CardContent className="p-6 text-center">
                <Globe className="w-8 h-8 text-mission-orange mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Multilingual Support</h3>
                <p className="text-white/70">Hindi and English interface with technical terminology</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
