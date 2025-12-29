import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rocket, Shield, Brain, ArrowRight, Cpu, Activity } from "lucide-react"
import { useLocation } from "wouter"
import earthImage from "@assets/generated_images/Earth_from_space_backdrop_d272d337.png"

export default function HeroSection() {
  const [, setLocation] = useLocation()

  const handleGetStarted = () => {
    setLocation("/trajectory")
  }

  const handleViewDemo = () => {
    setLocation("/dashboard")
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear hover:scale-105"
        style={{ backgroundImage: `url(${earthImage})` }}
      >
        {/* Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center space-y-8">

          {/* Main Heading */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <Badge variant="outline" className="bg-space-blue/10 text-space-blue border-space-blue/50 px-4 py-1.5 text-xs font-mono tracking-widest uppercase">
              <Activity className="w-3 h-3 mr-2 animate-pulse" />
              System Online // v2.0
            </Badge>

            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 tracking-tighter font-display leading-[0.9]">
              ODIN
            </h1>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl md:text-3xl font-bold text-space-blue tracking-[0.2em] font-display uppercase text-glow">
                Orbital Dynamics Intelligence Network
              </h2>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-space-blue to-transparent mt-2" />
            </div>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
              Advanced autonomous trajectory optimization for cislunar operations.
              Powered by <span className="text-white font-medium">Deep Reinforcement Learning</span> and <span className="text-white font-medium">NASA DONKI</span> telemetry.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
            <Button
              size="lg"
              className="bg-mission-orange hover:bg-mission-orange/80 text-black font-bold px-10 py-6 text-lg tracking-wide rounded-none clip-path-polygon border-glow transition-all hover:scale-105"
              onClick={handleGetStarted}
            >
              <Rocket className="w-5 h-5 mr-3" />
              INITIATE SEQUENCE
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/5 backdrop-blur-md px-10 py-6 text-lg font-mono tracking-wide rounded-none hover:border-space-blue transition-colors"
              onClick={handleViewDemo}
            >
              SYSTEM DEMO
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            {[
              {
                icon: Shield,
                title: "Threat Monitor",
                desc: "Real-time analysis of Solar Radiation Storms (S1-S5) and Coronal Mass Ejections.",
                color: "text-red-400"
              },
              {
                icon: Brain,
                title: "Neural Engine",
                desc: "1.2M parameter optimization model for continuous trajectory refinement.",
                color: "text-purple-400"
              },
              {
                icon: Cpu,
                title: "Lambert Solver",
                desc: "High-precision orbital mechanics solver for rapid intercept calculation.",
                color: "text-blue-400"
              }
            ].map((feature, i) => (
              <div key={i} className="group relative p-1">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                <div className="relative bg-black/40 backdrop-blur-md border border-white/10 p-8 h-full transition-colors group-hover:border-white/20 group-hover:bg-black/60">
                  <feature.icon className={`w-10 h-10 ${feature.color} mb-6`} />
                  <h3 className="text-xl font-bold text-white mb-3 font-display uppercase">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-mono">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
