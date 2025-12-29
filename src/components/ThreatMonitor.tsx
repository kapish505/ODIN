import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  AlertTriangle,
  Zap,
  Satellite,
  Radiation,
  CheckCircle,
  Loader2,
  WifiOff,
  RefreshCw,
  Info
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Threat {
  activityID: string;
  messageType?: string; // Optional to prevent crash
  messageBody?: string;
  messageIssueTime?: string;
}

const THREAT_TYPES: Record<string, string> = {
  "FLR": "Solar Flare",
  "SEP": "Solar Energetic Particle",
  "CME": "Coronal Mass Ejection",
  "IPS": "Interplanetary Shock",
  "MPC": "Magnetopause Crossing",
  "GST": "Geomagnetic Storm",
  "RBE": "Radiation Belt Enhancement",
  "HSS": "High Speed Stream",
  "WSAEnlil": "Solar Wind Model",
  "REPORT": "Space Weather Report"
};

export default function ThreatMonitor() {
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null)
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 8-second timeout for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

      const res = await fetch("/api/weather/notifications", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data)) {
        setThreats(data);
      } else {
        setThreats([]);
      }
    } catch (err) {
      console.warn("[ThreatMonitor] Fetch failed:", err);
      setError("Unable to reach Deep Space Network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  // Safe Accessors
  const activeCount = threats.length;
  const overallStatus = activeCount > 5 ? "Critical" : activeCount > 2 ? "Elevated" : "Nominal";
  const threatLevel = activeCount > 5 ? "High" : activeCount > 2 ? "Medium" : "Low";

  const getSeverityColor = (type?: string) => {
    if (!type) return "neutral-gray";
    const t = type.toUpperCase();
    if (t.includes("FLR") || t.includes("CME") || t.includes("GST")) return "warning-amber";
    if (t.includes("SEP") || t.includes("RBE")) return "critical-red";
    return "success-green";
  }

  const getThreatIcon = (type?: string) => {
    if (!type) return AlertTriangle;
    const t = type.toUpperCase();
    if (t.includes("FLR")) return Zap;
    if (t.includes("CME")) return Radiation;
    if (t.includes("SEP") || t.includes("RBE")) return Satellite;
    return AlertTriangle;
  }

  // Helper to get formatted name
  const getReadableName = (type?: string) => {
    if (!type) return "Unknown Anomaly";
    // Check known codes
    for (const [code, name] of Object.entries(THREAT_TYPES)) {
      if (type.toUpperCase().includes(code)) return name;
    }
    return type; // Fallback to raw type if not found
  }

  // Helper to extract a short preview from the body
  const getPreviewText = (body?: string) => {
    if (!body) return "No telemetry data available.";
    // Try to find summary section
    const summaryMatch = body.match(/## Summary:([\s\S]*?)(##|$)/);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim().slice(0, 120) + "...";
    }
    return body.slice(0, 120) + "...";
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-mission-orange" />
        <div className="flex flex-col items-center">
          <span className="text-mission-orange font-mono tracking-widest text-lg">SCANNING SECTOR</span>
          <span className="text-xs text-muted-foreground">Est. Latency: 1.2s</span>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="bg-red-500/10 p-6 rounded-full border border-red-500/50">
          <WifiOff className="w-12 h-12 text-red-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">UPLINK LOST</h3>
          <p className="text-muted-foreground w-64 mx-auto">{error}</p>
        </div>
        <Button onClick={fetchThreats} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
          <RefreshCw className="w-4 h-4 mr-2" />
          RETRY CONNECTION
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HUD Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 backdrop-blur border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-muted-foreground mb-1">System Status</p>
              <p className={`text-2xl font-bold font-display tracking-wider ${overallStatus === "Nominal" ? "text-green-400" : "text-yellow-400"}`}>
                {overallStatus.toUpperCase()}
              </p>
            </div>
            <CheckCircle className={`w-8 h-8 opacity-50 ${overallStatus === "Nominal" ? "text-green-400" : "text-yellow-400"}`} />
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-muted-foreground mb-1">Active Alerts</p>
              <p className="text-2xl font-bold font-display tracking-wider text-white">
                {activeCount.toString().padStart(2, '0')}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-muted-foreground mb-1">Radiation Index</p>
              <p className="text-2xl font-bold font-display tracking-wider text-mission-orange">
                {threatLevel.toUpperCase()}
              </p>
            </div>
            <Radiation className="w-8 h-8 text-mission-orange opacity-50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Feed */}
      <Card className="bg-black/60 backdrop-blur border-white/10 flex-1">
        <CardHeader className="border-b border-white/5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                DSN Telemetry Feed
              </CardTitle>
              <Badge variant="outline" className="border-white/10 text-[10px] text-gray-500 bg-white/5">NASA DONKI API</Badge>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-gray-500 hover:text-white transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-black border border-white/20 text-white max-w-xs p-3">
                    <p className="text-xs">
                      <strong>Database of Notifications, Knowledge, Information (DONKI)</strong>
                      <br /><br />
                      Real-time space weather data provided by NASA's Goddard Space Flight Center.
                      Monitors Solar Flares (FLR), CMEs, and Geomagnetic Storms that impact spacecraft operations.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button size="sm" variant="ghost" onClick={fetchThreats} className="h-8 w-8 p-0" title="Refresh Telemetry">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {activeCount === 0 && (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-green-500/20 mx-auto mb-4" />
                <p className="text-gray-400 font-mono">No active threats detected in local quadrant.</p>
              </div>
            )}
            {threats.map((threat) => {
              const ThreatIcon = getThreatIcon(threat.messageType)
              const isSelected = selectedThreat === threat.activityID
              const severityColor = getSeverityColor(threat.messageType);
              const dateObj = threat.messageIssueTime ? new Date(threat.messageIssueTime) : new Date();
              const readableName = getReadableName(threat.messageType);
              const previewText = getPreviewText(threat.messageBody);

              return (
                <div
                  key={threat.activityID}
                  className={`p-4 transition-colors hover:bg-white/5 cursor-pointer ${isSelected ? "bg-white/5" : ""}`}
                  onClick={() => setSelectedThreat(isSelected ? null : threat.activityID)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-md bg-${severityColor}/10 shrink-0`}>
                      <ThreatIcon className={`w-5 h-5 text-${severityColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          <h4 className="font-bold text-white text-sm truncate pr-4">
                            {readableName}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-mono tracking-wide">CODE: {threat.messageType}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 shrink-0">
                          {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Show Preview if not selected */}
                      {!isSelected && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-mono opacity-70">
                          {previewText}
                        </p>
                      )}

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                          <div className="mb-2">
                            <span className="text-[10px] uppercase text-gray-600 font-bold tracking-widest">Full Transmission</span>
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono text-xs">
                            {threat.messageBody || "No details provided."}
                          </p>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-none">
                              Archive Log
                            </Button>
                            <Button size="sm" className="h-7 text-xs bg-mission-orange text-black hover:bg-white">
                              Analyze Impact
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}