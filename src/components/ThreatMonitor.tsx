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
  RefreshCw
} from "lucide-react"

interface Threat {
  activityID: string;
  messageType?: string; // Optional to prevent crash
  messageBody?: string;
  messageIssueTime?: string;
}

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
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
    if (t.includes("FLR") || t.includes("CME")) return "warning-amber";
    if (t.includes("SEP")) return "critical-red";
    return "success-green";
  }

  const getThreatIcon = (type?: string) => {
    if (!type) return AlertTriangle;
    const t = type.toUpperCase();
    if (t.includes("FLR")) return Zap;
    if (t.includes("CME")) return Radiation;
    if (t.includes("SEP")) return Satellite;
    return AlertTriangle;
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
            <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Telescope Telemetry (NASA DONKI)
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={fetchThreats} className="h-8 w-8 p-0">
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
                        <h4 className="font-bold text-white text-sm truncate pr-4">
                          {threat.messageType || "UNKNOWN ANOMALY"}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500 shrink-0">
                          {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-1 font-mono">
                        ID: {threat.activityID}
                      </p>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {threat.messageBody || "No details provided."}
                          </p>
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