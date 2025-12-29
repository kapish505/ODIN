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
  Terminal,
  Activity
} from "lucide-react"
import Plotly from "plotly.js-dist-min"
import createPlotlyComponent from "react-plotly.js/factory"
import { generateLambertTrajectory, Vector3, calculateDeltaV, assessMissionRisk, WeatherConstraint } from "@/lib/lambert/solver"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

const Plot = createPlotlyComponent(Plotly)

interface LogEntry {
  timestamp: string;
  type: "INFO" | "WARN" | "DECISION" | "SUCCESS" | "CRITICAL";
  message: string;
}

export default function TrajectoryViewer() {
  const [speed, setSpeed] = useState([50])
  const [launchDate, setLaunchDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [startPos, setStartPos] = useState<Vector3>({ x: 7000, y: 0, z: 0 })

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [simulationPhase, setSimulationPhase] = useState<'IDLE' | 'NOMINAL' | 'ANALYZING' | 'OPTIMIZED'>('IDLE');
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type, message }]);
  };

  // 1. Ephemeris
  const targetPos = useMemo(() => {
    const epoch = new Date("2024-01-01T00:00:00Z").getTime();
    const currentCallback = new Date(launchDate).getTime();
    const diffDays = (currentCallback - epoch) / (1000 * 60 * 60 * 24);
    const period = 27.32;
    const distance = 384400;
    const angle = (diffDays / period) * 2 * Math.PI;
    return { x: distance * Math.cos(angle), y: distance * Math.sin(angle), z: 0 };
  }, [launchDate]);

  // 2. Data Fetching (The "Truth")
  // 2. Data Fetching (The "Truth")
  const { data: notifications, isLoading: isWeatherLoading, isError, error } = useQuery<any[]>({
    queryKey: ["/api/weather/notifications", launchDate],
    queryFn: async () => {
      const dateObj = new Date(launchDate);
      const dateStr = dateObj.toISOString().split('T')[0];
      const endDateObj = new Date(dateObj);
      endDateObj.setDate(endDateObj.getDate() + 7);
      const endDateStr = endDateObj.toISOString().split('T')[0];

      console.log(`[ODIN] Fetching Weather: ${dateStr} to ${endDateStr}`);
      const res = await apiRequest("GET", `/api/weather/notifications?startDate=${dateStr}&endDate=${endDateStr}`);

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) {
        console.error("[ODIN] API Response Invalid (Not Array):", json);
        return []; // Fail gracefully
      }
      return json;
    }
  });

  // Calculate the "True Risk" based on API data
  const trueRiskContext = useMemo(() => {
    if (!notifications) return { constraint: { solarFlare: false, geomagneticStorm: false, radiationFlux: 0 }, risk: { riskLevel: "Low", message: "Nominal" } };

    const launchTime = new Date(launchDate).getTime();
    console.log(`[ODIN] Launch Time: ${launchDate} (${launchTime})`);

    const windowAlerts = notifications.filter(n => {
      const issueTime = new Date(n.messageIssueTime).getTime();
      const diffHours = (issueTime - launchTime) / (1000 * 60 * 60);
      const inWindow = Math.abs(diffHours) < 96; // 96h window

      // Log relevant alerts to see why they match or fail
      if (Math.abs(diffHours) < 120) {
        console.log(`[ODIN] Alert ${n.messageID} (${n.messageType}): ${diffHours.toFixed(1)}h from launch. Included? ${inWindow}`);
      }

      return inWindow;
    });

    const constraint = {
      solarFlare: windowAlerts.some(n => n.messageType.includes("FLR")),
      geomagneticStorm: windowAlerts.some(n => n.messageType.includes("CME") || n.messageType.includes("GST")),
      radiationFlux: windowAlerts.some(n => n.messageType.includes("SEP")) ? 100 : 10
    };

    console.log("[ODIN] Calculated Constraints:", constraint);

    // Pass 3 days (72 hours) as standard Moon transit time
    return { constraint, risk: assessMissionRisk(constraint, 3) };
  }, [notifications, launchDate]);

  // 3. Trajectory Generation
  const nominalPath = useMemo(() => generateLambertTrajectory(startPos, targetPos, 100), [startPos, targetPos]);

  // This is the "Safe" path we *might* switch to
  const optimizedPath = useMemo(() => {
    return nominalPath.map((p, i) => {
      // Phase 1: Co-incident with Nominal Path (0-30%)
      if (i <= 30) {
        return p;
      }

      // Phase 2: Divergence (31-100%)
      // We want a smooth ease-in from 0 deviation at i=30
      const progress = (i - 30) / 70; // Normalized 0..1 for the remaining 70%

      // Smooth step function for natural orbital change
      // Using sine squared for smooth ease-in/ease-out
      const deviationFactor = Math.sin(progress * Math.PI);

      // Calculate deviation vector (mostly Z-axis for high-inclination)
      const zDeviation = deviationFactor * 40000;

      return {
        x: p.x,
        y: p.y,
        z: p.z + zDeviation
      };
    });
  }, [nominalPath]);

  // Ref to track phase immediately inside closures
  const simulationPhaseRef = useRef(simulationPhase);
  useEffect(() => {
    simulationPhaseRef.current = simulationPhase;
  }, [simulationPhase]);

  // 4. Simulation Logic
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(20, 110 - speed[0]);

      if (simulationPhase === 'ANALYZING') {
        // Specialized "Thinking" Loop
        const sequence = [
          { type: "CRITICAL", text: `ANOMALY DETECTED: ${trueRiskContext.risk.message}` },
          { type: "WARN", text: `Radiation thresholds exceeded on Nominal Path.` },
          { type: "DECISION", text: "Evaluating Mitigation Options..." },
          { type: "INFO", text: "Option A: Maintain Course. Est. Crew Dose: > 500 mSv. [REJECTED]" },
          { type: "INFO", text: "Option B: Abort to Earth. Fuel Insufficient. [REJECTED]" },
          { type: "INFO", text: `Option C: High-Inclination Transfer. Delta-V: +0.5 km/s. [ACCEPTED]` },
          { type: "SUCCESS", text: "Rerouting to Optimized Trajectory." }
        ];

        let step = 0;
        animationRef.current = setInterval(() => {
          if (step < sequence.length) {
            const log = sequence[step];
            // @ts-ignore
            addLog(log.type, log.text);
            step++;
          } else {
            setSimulationPhase('OPTIMIZED');
            if (animationRef.current) clearInterval(animationRef.current);
          }
        }, 600); // 600ms per log entry
      } else if (simulationPhase === 'NOMINAL' || simulationPhase === 'OPTIMIZED') {
        // Normal Animation Loop
        animationRef.current = setInterval(() => {
          setAnimationFrame(prev => {
            if (prev >= 100) {
              setIsPlaying(false);
              if (animationRef.current) clearInterval(animationRef.current);
              return 100;
            }

            const nextFrame = prev + 1;

            // --- EVENT INJECTION LOGIC ---
            if (nextFrame === 25 && simulationPhaseRef.current === 'NOMINAL') {
              addLog("INFO", "Initiating Deep Space Environmental Scan...");
            }

            // At 30%, Trigger Event if Risk Exists
            if (nextFrame === 30 && simulationPhaseRef.current === 'NOMINAL') {
              // Check Risk
              if (trueRiskContext.risk.riskLevel !== "Low") {
                console.log("[ODIN] Risk Detected. Transitioning to ANALYZING.");
                setSimulationPhase('ANALYZING');
                // No need for return check, interval clears naturally on re-render
              } else {
                addLog("SUCCESS", "Scan Nominal. No threats detected.");
              }
            }

            if (nextFrame === 100) {
              addLog("SUCCESS", "Mission Complete. Target Orbit Achieved.");
            }

            return nextFrame;
          });
        }, intervalMs);
      }
    }

    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [isPlaying, speed, simulationPhase, trueRiskContext]);


  // 5. Visualization Data Construction
  const plotData = useMemo(() => {
    // Current Path depends on phase
    const currentPath = simulationPhase === 'OPTIMIZED' ? optimizedPath : nominalPath;

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

    // Always show Nominal Path (faded if abandoned)
    const nominalTrace = {
      x: nominalPath.map(p => p.x),
      y: nominalPath.map(p => p.y),
      z: nominalPath.map(p => p.z),
      mode: 'lines',
      line: {
        color: simulationPhase === 'OPTIMIZED' ? '#ef4444' : '#4b5563',
        width: 3,
        dash: 'dash'
      },
      name: simulationPhase === 'OPTIMIZED' ? 'Rejected Path' : 'Nominal Path',
      type: 'scatter3d',
      opacity: simulationPhase === 'OPTIMIZED' ? 0.4 : 0.6
    };

    // Show Optimized Path only if activated
    const optimizedTrace = {
      x: optimizedPath.map(p => p.x),
      y: optimizedPath.map(p => p.y),
      z: optimizedPath.map(p => p.z),
      mode: 'lines',
      line: { color: '#22c55e', width: 6 },
      name: 'Optimized Path',
      type: 'scatter3d',
      visible: simulationPhase === 'OPTIMIZED'
    };

    // Spacecraft Marker
    const currentPos = currentPath[animationFrame] || startPos;
    const spacecraft = {
      x: [currentPos.x], y: [currentPos.y], z: [currentPos.z],
      mode: 'markers',
      marker: { size: 10, color: '#ffffff', symbol: 'diamond' },
      name: 'ODIN Spacecraft',
      type: 'scatter3d'
    };

    return [earth, moon, nominalTrace, optimizedTrace, spacecraft];
  }, [nominalPath, optimizedPath, targetPos, simulationPhase, animationFrame]);

  // Layout
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
                <Button
                  size="sm"
                  variant={isPlaying ? "destructive" : "default"}
                  disabled={isWeatherLoading}
                  onClick={() => {
                    // If mission ended (frame 100) or we want to restart
                    if (animationFrame >= 100) {
                      setAnimationFrame(0);
                      setSimulationPhase('NOMINAL');
                      setLogs([]);

                      // DEBUG: Log Launch Context
                      const loadedCount = notifications?.length || 0;
                      if (isError) {
                        addLog("CRITICAL", `[DEBUG] Weather Fetch Failed: ${error?.message}`);
                      } else {
                        addLog("INFO", `[DEBUG] Weather Data: ${loadedCount > 0 ? 'Loaded' : 'None'} (${loadedCount} alerts)`);
                      }
                      addLog("INFO", `[DEBUG] Launch Date: ${launchDate}`);

                      setIsPlaying(true);
                      return;
                    }

                    if (!isPlaying && simulationPhase === 'IDLE') {
                      setSimulationPhase('NOMINAL');
                      setAnimationFrame(0);

                      // DEBUG: Log Launch Context on first start
                      const loadedCount = notifications?.length || 0;
                      if (isError) {
                        addLog("CRITICAL", `[DEBUG] Weather Fetch Failed: ${error?.message}`);
                      } else {
                        addLog("INFO", `[DEBUG] Weather Data: ${loadedCount > 0 ? 'Loaded' : 'None'} (${loadedCount} alerts)`);
                      }
                      addLog("INFO", `[DEBUG] Launch Date: ${launchDate}`);
                    }
                    setIsPlaying(!isPlaying)
                  }}>
                  {isWeatherLoading ? (
                    <span className="flex items-center gap-2">
                      <Orbit className="w-4 h-4 animate-spin" /> Syncing...
                    </span>
                  ) : (
                    <>
                      {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {animationFrame >= 100 ? "Restart Mission" : isPlaying ? "Pause" : "Simulate Mission"}
                    </>
                  )}
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

              {/* Floating HUD Status */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Badge variant="outline" className={`
                             ${simulationPhase === 'NOMINAL' ? 'border-gray-500 text-gray-400' :
                    simulationPhase === 'ANALYZING' ? 'border-yellow-500 text-yellow-500 animate-pulse' :
                      simulationPhase === 'OPTIMIZED' ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-700'}
                             bg-black/50 backdrop-blur
                         `}>
                  STATUS: {simulationPhase}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Transparency Logs */}
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Terminal className="w-4 h-4 text-primary" />
                Decision Transparency Logs (Live Neural Stream)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border border-white/10 bg-black/50 p-4 font-mono text-xs">
                {logs.length === 0 && <span className="text-muted-foreground italic">System Idle. Awaiting simulation start...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-muted-foreground opacity-50">[{log.timestamp}]</span>
                    <span className={`font-bold ml-2 ${log.type === 'INFO' ? 'text-blue-400' :
                      log.type === 'WARN' ? 'text-yellow-400' :
                        log.type === 'CRITICAL' ? 'text-red-500 animate-pulse' :
                          log.type === 'DECISION' ? 'text-purple-400' :
                            'text-green-400'
                      }`}>[{log.type}]</span>
                    <span className="text-gray-300 ml-2">{log.message}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & Metrics */}
        <div className="space-y-6">
          <Card className="bg-black/20 border-white/10">
            <CardContent className="pt-6 space-y-6">
              <div className={`p-4 rounded-lg border ${trueRiskContext.risk.riskLevel === 'Low' ? 'bg-success-green/10 border-success-green/20' : 'bg-critical-red/10 border-critical-red/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {trueRiskContext.risk.riskLevel === 'Low' ? <ShieldAlert className="w-4 h-4 text-success-green" /> : <AlertTriangle className="w-4 h-4 text-critical-red" />}
                  <span className="font-semibold text-sm">Environment Forecast</span>
                </div>
                <p className="text-xs text-muted-foreground">{trueRiskContext.risk.message}</p>
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
                  <span className="text-muted-foreground">Active Protocol:</span>
                  <span className={simulationPhase === 'OPTIMIZED' ? "text-success-green" : "text-gray-400"}>
                    {simulationPhase === 'IDLE' ? "STANDBY" : simulationPhase}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Delta V:</span>
                  <span>{calculateDeltaV(
                    { x: 10, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, startPos, targetPos
                  ).toFixed(2)} km/s</span>
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