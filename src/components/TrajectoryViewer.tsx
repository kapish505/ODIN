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
  Activity,
  HelpCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  // Hoist currentPath so it's accessible for HUD telemetry
  const currentPath = simulationPhase === 'OPTIMIZED' ? optimizedPath : nominalPath;

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
  }, [nominalPath, optimizedPath, targetPos, simulationPhase, animationFrame, currentPath, startPos]);

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
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* 1. COMMAND BAR */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10 shrink-0">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Orbit className="w-5 h-5 text-mission-orange" />
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider">LAMBERT SOLVER</span>
                <span className="text-[10px] text-muted-foreground font-mono">ODIN-GNC-04</span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border bg-black/50 ${simulationPhase === 'NOMINAL' ? 'border-gray-500 text-gray-400' :
              simulationPhase === 'ANALYZING' ? 'border-yellow-500 text-yellow-500 animate-pulse' :
                simulationPhase === 'OPTIMIZED' ? 'border-green-500 text-green-500' :
                  'border-gray-700 text-gray-700'
              }`}>
              <Activity className="w-3 h-3" />
              <span className="text-xs font-mono font-bold">{simulationPhase}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <input
                type="datetime-local"
                value={launchDate}
                onChange={e => setLaunchDate(e.target.value)}
                className="bg-transparent border-none text-xs font-mono focus:ring-0 p-0 text-white w-32"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Sim Speed</span>
              <Slider value={speed} onValueChange={setSpeed} max={100} min={1} step={1} className="w-24" />
            </div>

            <Button
              size="sm"
              className={`font-mono text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-mission-orange hover:bg-mission-orange/90 text-black"
                }`}
              disabled={isWeatherLoading}
              onClick={() => {
                if (animationFrame >= 100) {
                  setAnimationFrame(0);
                  setSimulationPhase('NOMINAL');
                  setLogs([]);
                  setIsPlaying(true);
                  return;
                }
                if (!isPlaying && simulationPhase === 'IDLE') {
                  setSimulationPhase('NOMINAL');
                  setAnimationFrame(0);
                  // Debug logs...
                  const loadedCount = notifications?.length || 0;
                  addLog("INFO", `[SYSTEM] Launch Sequence Initiated. Weather Data: ${loadedCount} alerts.`);
                }
                setIsPlaying(!isPlaying)
              }}>
              {isWeatherLoading ? (
                <span className="flex items-center gap-2"><Orbit className="w-3 h-3 animate-spin" /> SYNCING...</span>
              ) : (
                <>
                  {isPlaying ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                  {animationFrame >= 100 ? "RESTART MISSION" : isPlaying ? "ABORT / PAUSE" : "ENGAGE SIMULATION"}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* 2. VISUALIZATION CORE (75%) */}
        <Card className="lg:col-span-3 bg-black/60 backdrop-blur-sm border-white/10 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />
          <CardContent className="flex-1 p-0 relative">
            <Plot
              data={plotData as any}
              layout={layout as any}
              useResizeHandler
              className="w-full h-full"
              config={{ displayModeBar: false, responsive: true }}
            />

            {/* Floating HUD Elements */}
            <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">Telemetry</span>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-gray-500 block">ALTITUDE</span>
                    <span className="text-sm font-mono text-blue-400">{(currentPath[animationFrame]?.x || 0).toFixed(0)} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">VELOCITY</span>
                    <span className="text-sm font-mono text-blue-400">{(Math.random() * 2 + 10).toFixed(2)} km/s</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. TELEMETRY DECK (25%) */}
        <div className="space-y-4 flex flex-col h-full overflow-hidden">

          {/* Module A: Environment */}
          <Card className={`shrink-0 border bg-black/40 backdrop-blur ${trueRiskContext.risk.riskLevel === 'Low' ? 'border-success-green/30' : 'border-critical-red/50'}`}>
            <CardHeader className="py-3 px-4 border-b border-white/5">
              <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                Environment Scan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Solar Activity
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-white transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] bg-black/90 border-white/20 text-xs">
                      <p>Current intensity of solar flares (X-Ray flux) and geomagnetic storms affecting cislunar space.</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Badge variant="outline" className={`text-[10px] ${trueRiskContext.constraint.solarFlare ? 'text-red-400 border-red-500' : 'text-green-400 border-green-900'}`}>
                  {trueRiskContext.constraint.solarFlare ? "FLARE DETECTED" : "NOMINAL"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Radiation Flux
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-white transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] bg-black/90 border-white/20 text-xs">
                      <p>Density of high-energy protons in the flight path. &gt;50% requires trajectory abort or hardening.</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Badge variant="outline" className={`text-[10px] ${trueRiskContext.constraint.radiationFlux > 50 ? 'text-red-400 border-red-500' : 'text-green-400 border-green-900'}`}>
                  {trueRiskContext.constraint.radiationFlux}%
                </Badge>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <p className={`text-xs font-mono leading-tight ${trueRiskContext.risk.riskLevel === 'Low' ? 'text-gray-400' : 'text-red-400'}`}>
                {trueRiskContext.risk.message}
              </p>
            </CardContent>
          </Card>

          {/* Module B: Flight Computer */}
          <Card className="shrink-0 bg-black/40 backdrop-blur border-white/10">
            <CardHeader className="py-3 px-4 border-b border-white/5">
              <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-3 h-3" />
                Flight Computer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1 flex items-center gap-1">
                    DELTA-V EST
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-white transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] bg-black/90 border-white/20 text-xs">
                        <p>Change in velocity required to perform the transfer orbit maneuver. Higher values require more fuel.</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-lg font-mono font-bold text-white">
                    {/* Add subtle jitter to Delta-V to simulate sensor noise */}
                    {(calculateDeltaV({ x: 10, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, startPos, targetPos) + (Math.sin(Date.now() / 1000) * 0.02)).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-1">km/s</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1 flex items-center gap-1">
                    WINDOW
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-white transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] bg-black/90 border-white/20 text-xs">
                        <p>Remaining launch opportunity duration before optimal alignment is lost.</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="text-lg font-mono font-bold text-white">72</span>
                  <span className="text-[10px] text-gray-500 ml-1">HRS</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-[10px] h-6 border-white/10 hover:bg-white/5" onClick={() => setLogs([])}>
                PURGE LOGS
              </Button>
            </CardContent>
          </Card>

          {/* Module C: Neural Stream (Logs) */}
          <Card className="flex-1 min-h-0 bg-black/40 backdrop-blur border-white/10 flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-white/5 shrink-0">
              <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3 h-3 text-purple-400" />
                Neural Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              <div className="absolute inset-0 p-3 overflow-auto font-mono text-[10px] space-y-1.5 scrollbar-hide">
                {logs.length === 0 && <div className="text-gray-600 italic text-center mt-10">Waiting for telemetry...</div>}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`${log.type === 'INFO' ? 'text-blue-400' :
                      log.type === 'WARN' ? 'text-yellow-400' :
                        log.type === 'CRITICAL' ? 'text-red-500 font-bold' :
                          log.type === 'DECISION' ? 'text-purple-400' : 'text-green-400'
                      }`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}