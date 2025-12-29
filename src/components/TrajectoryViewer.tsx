import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Orbit,
  Calculator,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Play,
  Pause,
  Terminal
} from "lucide-react"
import Plotly from "plotly.js-dist-min"
import createPlotlyComponent from "react-plotly.js/factory"
import { generateLambertTrajectory, Vector3, calculateDeltaV, assessMissionRisk, WeatherConstraint } from "@/lib/lambert/solver"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

const Plot = createPlotlyComponent(Plotly)

interface LogEntry {
  timestamp: string;
  type: "INFO" | "WARN" | "DECISION" | "SUCCESS";
  message: string;
}

export default function TrajectoryViewer() {
  const [speed, setSpeed] = useState([50]) // Simulation speed (ms per frame)
  const [launchDate, setLaunchDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [startPos, setStartPos] = useState<Vector3>({ x: 7000, y: 0, z: 0 })

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Logs State
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type, message }]);
  };

  // 1. Calculate Moon Position
  const targetPos = useMemo(() => {
    const epoch = new Date("2024-01-01T00:00:00Z").getTime();
    const currentCallback = new Date(launchDate).getTime();
    const diffDays = (currentCallback - epoch) / (1000 * 60 * 60 * 24);

    const period = 27.32;
    const distance = 384400;
    const angle = (diffDays / period) * 2 * Math.PI;

    return { x: distance * Math.cos(angle), y: distance * Math.sin(angle), z: 0 };
  }, [launchDate]);

  // 2. Fetch Weather
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/weather/notifications", launchDate],
    queryFn: async () => {
      const dateObj = new Date(launchDate);
      const dateStr = dateObj.toISOString().split('T')[0];
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
    const windowAlerts = notifications.filter(n => {
      const issueTime = new Date(n.messageIssueTime).getTime();
      return Math.abs(issueTime - launchTime) < (48 * 60 * 60 * 1000);
    });

    return {
      solarFlare: windowAlerts.some(n => n.messageType.includes("FLR")),
      geomagneticStorm: windowAlerts.some(n => n.messageType.includes("CME") || n.messageType.includes("GST")),
      radiationFlux: windowAlerts.some(n => n.messageType.includes("SEP")) ? 100 : 10
    };
  }, [notifications, launchDate]);

  // 3. Risk Assessment & Logging
  const missionRisks = useMemo(() => {
    const risk = assessMissionRisk(weatherConstraint, 72); // Hardcoded 72h TOF for baseline
    return risk;
  }, [weatherConstraint]);

  // Effect to handle logging side-effects safely
  useEffect(() => {
    setLogs([]);
    addLog("INFO", "Initializing trajectory calculation...");

    if (missionRisks.riskLevel === "Low") {
      addLog("SUCCESS", "Conditions nominal. Standard Hohmann transfer approved.");
    } else {
      addLog("WARN", `Threat detected: ${missionRisks.message}`);
      addLog("DECISION", "Calculating optimized avoidance trajectory...");
      addLog("INFO", `Applying Delta-V penalty for ${missionRisks.riskLevel} risk environment.`);
    }
  }, [missionRisks.riskLevel, missionRisks.message]);


  // 4. Generate Trajectories
  const nominalPath = useMemo(() => generateLambertTrajectory(startPos, targetPos, 100), [startPos, targetPos]);

  const activePath = useMemo(() => {
    if (missionRisks.riskLevel === "Low") return nominalPath;

    // Generate "Optimized" path by adding a Z-deviation (inclination change) to simulate avoidance
    return nominalPath.map((p, i) => {
      const progress = i / 100;
      const deviation = Math.sin(progress * Math.PI) * 50000; // 50km arch
      return { ...p, z: p.z + deviation };
    });
  }, [nominalPath, missionRisks]);

  // 5. Physics Metrics
  const deltaV = useMemo(() => {
    const base = calculateDeltaV({ x: 10, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, startPos, targetPos);
    const penalty = missionRisks.riskLevel === "High" ? 0.5 : missionRisks.riskLevel === "Critical" ? 999 : 0;
    return base + penalty;
  }, [startPos, targetPos, missionRisks]);

  // 6. Animation Loop
  useEffect(() => {
    if (isPlaying) {
      // Speed value: lower is faster interval. Map 1-100 to 100ms-10ms
      const intervalMs = Math.max(10, 110 - speed[0]);

      animationRef.current = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % 100);
      }, intervalMs);
    } else if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [isPlaying, speed]);

  // 7. Plot Data
  const plotData = useMemo(() => {
    const earth = {
      x: [0], y: [0], z: [0],
      mode: 'markers',
      marker: { size: 12, color: '#3b82f6' },
      name: 'Earth',
      type: 'scatter3d'
    };

    const moon = {
      x: [targetPos.x], y: [targetPos.y], z: [targetPos.z],
      mode: 'markers',
      marker: { size: 8, color: '#9ca3af' },
      name: 'Moon',
      type: 'scatter3d'
    };

    const nominalTrace = {
      x: nominalPath.map(p => p.x),
      y: nominalPath.map(p => p.y),
      z: nominalPath.map(p => p.z),
      mode: 'lines',
      line: { color: '#4b5563', width: 2, dash: 'dash' }, // Gray dashed
      name: 'Nominal Path',
      type: 'scatter3d',
      opacity: 0.5
    };

    const optimizedTrace = {
      x: activePath.map(p => p.x),
      y: activePath.map(p => p.y),
      z: activePath.map(p => p.z),
      mode: 'lines',
      line: { color: missionRisks.color, width: 6 },
      name: missionRisks.riskLevel === 'Low' ? 'Active Trajectory' : 'Optimized Avoidance Path',
      type: 'scatter3d'
    };

    // Spacecraft Marker
    const currentPos = activePath[animationFrame] || startPos;
    const spacecraft = {
      x: [currentPos.x], y: [currentPos.y], z: [currentPos.z],
      mode: 'markers',
      marker: { size: 10, color: '#ffffff', symbol: 'diamond' },
      name: 'ODIN Spacecraft',
      type: 'scatter3d'
    };

    return [earth, moon, nominalTrace, optimizedTrace, spacecraft];
  }, [nominalPath, activePath, targetPos, missionRisks, animationFrame]);

  const layout = useMemo(() => ({
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: { title: 'X (km)', gridcolor: '#334155', zerolinecolor: '#334155', showbackground: false },
      yaxis: { title: 'Y (km)', gridcolor: '#334155', zerolinecolor: '#334155', showbackground: false },
      zaxis: { title: 'Z (km)', gridcolor: '#334155', zerolinecolor: '#334155', showbackground: false },
      camera: { eye: { x: 1.5, y: 1.5, z: 0.5 } }
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    showlegend: true,
    legend: { x: 0, y: 1, font: { color: '#ffffff' } }
  }), []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Visualization */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Orbit className="w-5 h-5 text-mission-orange" />
                Lambert Trajectory Solver
              </CardTitle>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-xs text-muted-foreground w-12">Speed</span>
                  <Slider value={speed} onValueChange={setSpeed} max={100} min={1} step={1} className="w-24" />
                </div>
                <Button size="sm" variant={isPlaying ? "destructive" : "default"} onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Simulate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[500px] bg-black/40 relative rounded-md overflow-hidden border border-white/5">
              <Plot
                data={plotData as any}
                layout={layout as any}
                useResizeHandler
                className="w-full h-full"
                config={{ displayModeBar: false }}
              />
            </CardContent>
          </Card>

          {/* Transparency Logs */}
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Terminal className="w-4 h-4 text-primary" />
                Decision Transparency Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px] w-full rounded-md border border-white/10 bg-black/50 p-4">
                {logs.map((log, i) => (
                  <div key={i} className="mb-2 text-xs font-mono">
                    <span className="text-muted-foreground">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'INFO' ? 'text-blue-400 ml-2' :
                        log.type === 'WARN' ? 'text-yellow-400 ml-2' :
                          log.type === 'DECISION' ? 'text-purple-400 ml-2' :
                            'text-green-400 ml-2'
                    }>{log.type}:</span>
                    <span className="text-white/80 ml-2">{log.message}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          <Card className="bg-black/20 border-white/10">
            <CardContent className="pt-6 space-y-6">
              <div className={`p-4 rounded-lg border ${missionRisks.safe ? 'bg-success-green/10 border-success-green/20' : 'bg-critical-red/10 border-critical-red/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {missionRisks.safe ? <ShieldAlert className="w-4 h-4 text-success-green" /> : <AlertTriangle className="w-4 h-4 text-critical-red" />}
                  <span className="font-semibold text-sm">{missionRisks.riskLevel} Risk Detected</span>
                </div>
                <p className="text-xs text-muted-foreground">{missionRisks.message}</p>
              </div>

              <div className="space-y-2">
                <Label>Launch Window</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input type="datetime-local" value={launchDate} onChange={e => setLaunchDate(e.target.value)} className="bg-white/5" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Path:</span>
                  <span className={missionRisks.riskLevel === 'Low' ? "text-success-green" : "text-mission-orange"}>
                    {missionRisks.riskLevel === 'Low' ? "DIRECT" : "OPTIMIZED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Delta V:</span>
                  <span>{deltaV.toFixed(2)} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flight Time:</span>
                  <span>72 Hours</span>
                </div>
                <div className="flex justify-between pt-2">
                  <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setLogs([])}>
                    Clear Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}