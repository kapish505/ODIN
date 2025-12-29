import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Orbit,
  Calculator,
  AlertTriangle,
  ShieldAlert,
  Calendar
} from "lucide-react"
import Plotly from "plotly.js-dist-min"
import createPlotlyComponent from "react-plotly.js/factory"
import { generateLambertTrajectory, Vector3, calculateDeltaV, assessMissionRisk, WeatherConstraint } from "@/lib/lambert/solver"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

const Plot = createPlotlyComponent(Plotly)

export default function TrajectoryViewer() {
  const [tof, setTof] = useState([72]) // Time of flight in hours
  const [launchDate, setLaunchDate] = useState<string>(new Date().toISOString().slice(0, 16)); // Default to now
  const [startPos, setStartPos] = useState<Vector3>({ x: 7000, y: 0, z: 0 })

  // Calculate Moon Position based on Date (Simplified Circular Model)
  // Moon orbits Earth every ~27.32 days.
  // We'll anchor 0 degrees to some epoch and rotate.
  const targetPos = useMemo(() => {
    const epoch = new Date("2024-01-01T00:00:00Z").getTime();
    const currentCallback = new Date(launchDate).getTime();
    const diffDays = (currentCallback - epoch) / (1000 * 60 * 60 * 24);

    const period = 27.32; // Sidereal month
    const distance = 384400; // Semi-major axis (km)

    // Calculate angle in radians
    const angle = (diffDays / period) * 2 * Math.PI;

    return {
      x: distance * Math.cos(angle),
      y: distance * Math.sin(angle),
      z: 0 // Simplified 2D plane for demo
    };
  }, [launchDate]);

  // Fetch Space Weather for specific Launch Window
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/weather/notifications", launchDate],
    queryFn: async () => {
      // Fetch weather for the specific launch day window + TOF
      const dateObj = new Date(launchDate);
      const dateStr = dateObj.toISOString().split('T')[0];
      // For demo, we search a week around launch date to catch events
      const endDateObj = new Date(dateObj);
      endDateObj.setDate(endDateObj.getDate() + 7);
      const endDateStr = endDateObj.toISOString().split('T')[0];

      const res = await apiRequest("GET", `/api/weather/notifications?startDate=${dateStr}&endDate=${endDateStr}`);
      return res.json();
    }
  });

  const weatherConstraint: WeatherConstraint = useMemo(() => {
    if (!notifications) return { solarFlare: false, geomagneticStorm: false, radiationFlux: 0 };

    const launchTime = new Date(launchDate).getTime();
    // Check for alerts active during the flight window
    const windowAlerts = notifications.filter(n => {
      const issueTime = new Date(n.messageIssueTime).getTime();
      // Check if alert was issued recently or during flight
      return Math.abs(issueTime - launchTime) < (48 * 60 * 60 * 1000);
    });

    return {
      solarFlare: windowAlerts.some(n => n.messageType.includes("FLR")),
      geomagneticStorm: windowAlerts.some(n => n.messageType.includes("CME") || n.messageType.includes("GST")),
      radiationFlux: windowAlerts.some(n => n.messageType.includes("SEP")) ? 100 : 10
    };
  }, [notifications, launchDate]);

  // Assessment
  const missionRisks = useMemo(() => {
    return assessMissionRisk(weatherConstraint, tof[0] / 24);
  }, [weatherConstraint, tof]);

  // Calculate trajectory points
  const trajectoryPoints = useMemo(() => {
    return generateLambertTrajectory(startPos, targetPos, 100);
  }, [startPos, targetPos]);

  // Calculate Physics Metrics
  const deltaV = useMemo(() => {
    // Rough vectors for demo calculation
    const calculated = calculateDeltaV(
      { x: 10, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      startPos,
      targetPos
    );
    const penalty = missionRisks.riskLevel === "High" ? 0.5 : missionRisks.riskLevel === "Critical" ? 999 : 0;
    return calculated + penalty;
  }, [startPos, targetPos, missionRisks]);


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
      line: {
        color: missionRisks.color, // Dynamic Color based on Risk
        width: 5
      },
      name: 'Flight Path',
      type: 'scatter3d'
    };

    return [earth, moon, path];
  }, [trajectoryPoints, targetPos, missionRisks]);

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
              <Badge className={`bg-${missionRisks.riskLevel === 'Low' ? 'success-green' : 'critical-red'}/20 text-${missionRisks.riskLevel === 'Low' ? 'success-green' : 'critical-red'} border-current`}>
                {missionRisks.riskLevel} Risk
              </Badge>
              <Badge variant="outline" className="border-mission-orange text-mission-orange">
                Real-Time Physics
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

              {/* Mission Status Alert */}
              <div className={`p-4 rounded-lg border ${missionRisks.safe ? 'bg-success-green/10 border-success-green/20' : 'bg-critical-red/10 border-critical-red/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {missionRisks.safe ? <ShieldAlert className="w-4 h-4 text-success-green" /> : <AlertTriangle className="w-4 h-4 text-critical-red" />}
                  <span className="font-semibold text-sm">{missionRisks.safe ? "Trajectory Nominal" : "Hazard Detected"}</span>
                </div>
                <p className="text-xs text-muted-foreground">{missionRisks.message}</p>
              </div>

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
                <Label>Mission Launch Date</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Data Source: NASA DONKI & Ephemeris</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        value={launchDate}
                        onChange={e => setLaunchDate(e.target.value)}
                        className="bg-white/5"
                      />
                    </div>
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
                  <span className="text-muted-foreground">Est. Delta V:</span>
                  <span>{deltaV.toFixed(2)} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuel Efficiency:</span>
                  <span className={deltaV > 6 ? "text-critical-red" : "text-success-green"}>{deltaV > 6 ? "Low" : "High"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}