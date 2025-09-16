import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  RotateCcw, 
  Play, 
  Pause, 
  Square, 
  Maximize, 
  Settings,
  Target,
  Orbit
} from "lucide-react"
import trajectoryImage from "@assets/generated_images/Orbital_trajectory_visualization_bda0124a.png"

export default function TrajectoryViewer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeScale, setTimeScale] = useState([1])
  const [selectedPhase, setSelectedPhase] = useState("transfer")

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    console.log(isPlaying ? 'Pausing trajectory simulation' : 'Starting trajectory simulation')
  }

  const handleStop = () => {
    setIsPlaying(false)
    console.log('Stopping trajectory simulation')
  }

  const handleReset = () => {
    setIsPlaying(false)
    console.log('Resetting trajectory to initial position')
  }

  const trajectoryPhases = [
    { id: "launch", name: "Launch", status: "completed" },
    { id: "transfer", name: "Transfer Orbit", status: "active" },
    { id: "approach", name: "Lunar Approach", status: "pending" },
    { id: "insertion", name: "Orbit Insertion", status: "pending" }
  ]

  return (
    <div className="space-y-6">
      {/* 3D Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Orbit className="w-5 h-5 text-mission-orange" />
              3D Trajectory Visualization
            </CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-success-green/20 text-success-green">
                Lambert Solution Calculated
              </Badge>
              <Button size="icon" variant="outline" data-testid="button-fullscreen">
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Placeholder for 3D visualization - would be Three.js in real implementation */}
          <div className="relative aspect-video bg-gradient-to-br from-space-blue/20 to-black/40 rounded-lg overflow-hidden">
            <img 
              src={trajectoryImage} 
              alt="Trajectory Visualization" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-white font-mono text-sm">
                  3D Trajectory Display
                </div>
                <div className="text-mission-orange font-mono text-xs">
                  Earth → L1 Lagrange → Moon Orbit
                </div>
              </div>
            </div>
            
            {/* Overlay Controls */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between bg-black/60 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handlePlayPause}
                    data-testid="button-play-pause"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleStop}
                    data-testid="button-stop"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleReset}
                    data-testid="button-reset"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-white text-sm">
                  <span>Time Scale:</span>
                  <div className="w-24">
                    <Slider
                      value={timeScale}
                      onValueChange={setTimeScale}
                      max={10}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <span>{timeScale[0]}x</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Phases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-mission-orange" />
              Mission Phases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trajectoryPhases.map((phase) => (
                <div 
                  key={phase.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover-elevate ${
                    selectedPhase === phase.id ? 'bg-mission-orange/10 border-mission-orange' : 'border-border'
                  }`}
                  onClick={() => {
                    setSelectedPhase(phase.id)
                    console.log(`Selected trajectory phase: ${phase.name}`)
                  }}
                  data-testid={`phase-${phase.id}`}
                >
                  <span className="font-medium">{phase.name}</span>
                  <Badge 
                    className={
                      phase.status === 'completed' ? 'bg-success-green/20 text-success-green' :
                      phase.status === 'active' ? 'bg-mission-orange/20 text-mission-orange' :
                      'bg-neutral-gray/20 text-neutral-gray'
                    }
                  >
                    {phase.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trajectory Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Total ΔV</div>
                  <div className="font-semibold">3.15 km/s</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Flight Time</div>
                  <div className="font-semibold">72.4 hours</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fuel Mass</div>
                  <div className="font-semibold">1,247 kg</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Efficiency</div>
                  <div className="font-semibold text-success-green">94.2%</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-muted-foreground mb-2">AI Recommendations</div>
                <div className="text-sm space-y-1">
                  <div>• Optimal launch window: 2024-03-15 14:30 UTC</div>
                  <div>• Solar activity favorable for 48-hour period</div>
                  <div>• Debris avoidance maneuver at T+36:15</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}