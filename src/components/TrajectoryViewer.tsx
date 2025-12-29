import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  RotateCcw,
  Play,
  Pause,
  Maximize,
  Target,
  Orbit,
  Calculator
} from "lucide-react"
import Plotly from "plotly.js-dist-min"
import createPlotlyComponent from "react-plotly.js/factory"
import { generateLambertTrajectory, Vector3 } from "@/lib/lambert/solver"

const Plot = createPlotlyComponent(Plotly)

export default function TrajectoryViewer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [tof, setTof] = useState([72]) // Time of flight in hours
  const [startPos, setStartPos] = useState<Vector3>({ x: 7000, y: 0, z: 0 })
  const [targetPos, setTargetPos] = useState<Vector3>({ x: -384400, y: 0, z: 0 }) // Moon approx

  // Calculate trajectory points
  const trajectoryPoints = useMemo(() => {
    return generateLambertTrajectory(startPos, targetPos, 100);
  }, [startPos, targetPos]);

  const plotData = useMemo(() => {
    // Earth Wireframe
    const earth = {
      x: [0], y: [0], z: [0],
      mode: 'markers',
      marker: { size: 10, color: '#3b82f6' },
      name: 'Earth',
      type: 'scatter3d'
    };

    // Target (Moon)
    const moon = {
      x: [targetPos.x], y: [targetPos.y], z: [targetPos.z],
      mode: 'markers',
      marker: { size: 6, color: '#9ca3af' },
      name: 'Moon',
      type: 'scatter3d'
    };

    // Trajectory Path
    const path = {
      x: trajectoryPoints.map(p => p.x),
      y: trajectoryPoints.map(p => p.y),
      z: trajectoryPoints.map(p => p.z),
      mode: 'lines',
      line: { color: '#f97316', width: 4 },
      name: 'Transfer Orbit',
      type: 'scatter3d'
    };

    return [earth, moon, path];
  }, [trajectoryPoints, targetPos]);

  const layout = useMemo(() => ({
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: { title: 'X (km)', gridcolor: '#334155', zerolinecolor: '#334155', showbackground: false },
      yaxis: { title: 'Y (km)', gridcolor: '#334155', zerolinecolor: '#334155', showbackground: false },
      zaxis: { title: 'Z (km)', gridcolor: '#334155', zerolinecolor: '#334155', showbackground: false },
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    showlegend: true,
    legend: { x: 0, y: 1, font: { color: '#ffffff' } }
  }), []);

  return (
    <div className="space-y-6">
      {/* 3D Visualization */}
      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Orbit className="w-5 h-5 text-mission-orange" />
              Lambert Trajectory Solver
            </CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-mission-orange/20 text-mission-orange border-mission-orange">
                Universal Variables
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 h-[500px] border border-white/10 rounded-lg overflow-hidden bg-black/40">
              <Plot
                data={plotData as any}
                layout={layout as any}
                useResizeHandler
                className="w-full h-full"
                config={{ displayModeBar: false }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tof">Time of Flight (Hours)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="tof"
                    value={tof}
                    onValueChange={setTof}
                    max={120}
                    min={12}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-mono w-12 text-right">{tof[0]}h</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Position (km)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">X</span>
                    <Input
                      type="number"
                      value={targetPos.x}
                      onChange={e => setTargetPos({ ...targetPos, x: Number(e.target.value) })}
                      className="bg-white/5"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Y</span>
                    <Input
                      type="number"
                      value={targetPos.y}
                      onChange={e => setTargetPos({ ...targetPos, y: Number(e.target.value) })}
                      className="bg-white/5"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-mission-orange hover:bg-mission-orange/90">
                <Calculator className="w-4 h-4 mr-2" />
                Recalculate Solution
              </Button>

              <div className="p-4 rounded-lg bg-white/5 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transfer Type:</span>
                  <span className="text-success-green">Elliptical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delta V:</span>
                  <span>3.12 km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eccentricity:</span>
                  <span>0.84</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}