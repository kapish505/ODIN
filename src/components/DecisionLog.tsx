import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Terminal,
  Activity
} from "lucide-react"

interface TradeOffs {
  fuelCost?: string;
  travelTime?: string;
  radiationReduction?: string;
  safetyScore?: string;
  collisionRisk?: string;
  powerDraw?: string;
  [key: string]: string | undefined;
}

interface Decision {
  id: number;
  timestamp: string;
  threatDetected: string;
  originalTrajectory: string;
  selectedTrajectory: string;
  reasoning: string;
  tradeOffs: TradeOffs;
  status: string;
  confidence: number;
}

export default function DecisionLog() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const res = await fetch("/api/ai/decisions");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setDecisions(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (e) {
        console.error("Failed to load decisions", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDecisions();
  }, []);

  const activeDecision = decisions.find(d => d.id === selectedId) || decisions[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 animate-pulse text-purple-400" />
          <span className="text-muted-foreground font-mono">Deciphering Neural Logs...</span>
        </div>
      </div>
    )
  }

  if (decisions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No autonomous decisions recorded in log.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel: Decision History (Timeline) */}
      <Card className="lg:col-span-4 flex flex-col h-full bg-black/40 backdrop-blur border-white/10">
        <CardHeader className="py-4 border-b border-white/5 bg-black/20">
          <CardTitle className="text-sm font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-mission-orange" />
            Decision Timeline
          </CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-3">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                onClick={() => setSelectedId(decision.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all border group relative overflow-hidden ${selectedId === decision.id
                    ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                  }`}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <Badge variant="outline" className={`${decision.status === "EXECUTING" ? "text-purple-400 border-purple-400/50 animate-pulse" :
                      "text-green-400 border-green-400/50"
                    }`}>
                    {decision.status}
                  </Badge>
                  <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(decision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-200 mb-2 relative z-10 font-display">{decision.threatDetected}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 relative z-10">
                  <GitBranch className="w-3 h-3 text-purple-400" />
                  <span className="font-mono truncate">{decision.selectedTrajectory}</span>
                </div>
                {/* Active Indicator Bar */}
                {selectedId === decision.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Right Panel: Detailed Analysis */}
      <Card className="lg:col-span-8 flex flex-col h-full bg-black/60 backdrop-blur border-white/10 overflow-hidden relative">
        {activeDecision ? (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">

            {/* Header / Impact Assessment */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-transparent">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-bold font-display tracking-wide text-white mb-2 text-glow">
                    {activeDecision.threatDetected}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-gray-400">
                    <span className="bg-white/5 px-2 py-1 rounded">ID: {activeDecision.id.toString().padStart(6, '0')}</span>
                    <span className="text-purple-400 font-bold">CONFIDENCE: {(activeDecision.confidence).toFixed(1)}%</span>
                  </div>
                </div>
                {activeDecision.status === "EXECUTING" && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span className="text-xs font-bold text-purple-300 tracking-wider">ACTIVE MANEUVER</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-lg bg-black/40 border border-red-500/20 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                  <div className="relative z-10">
                    <div className="text-xs uppercase text-red-400 mb-2 font-bold tracking-wider">Original Trajectory</div>
                    <div className="text-gray-200 font-mono font-bold flex items-center gap-3 text-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      {activeDecision.originalTrajectory}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-lg bg-purple-900/20 border border-purple-500/30 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                  <div className="relative z-10">
                    <div className="text-xs uppercase text-purple-300 mb-2 font-bold tracking-wider">Optimized Solution</div>
                    <div className="text-white font-mono font-bold flex items-center gap-3 text-lg">
                      <CheckCircle className="w-5 h-5 text-purple-400" />
                      {activeDecision.selectedTrajectory}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Context / Reasoning */}
            <div className="p-8 grid grid-cols-1 gap-8">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                  <Brain className="w-4 h-4 text-mission-orange" />
                  Neural Reasoning Logic
                </h3>
                <div className="p-6 rounded-lg bg-white/5 border-l-2 border-mission-orange/50 leading-relaxed text-gray-300 font-mono text-sm relative">
                  <Terminal className="w-4 h-4 absolute top-4 right-4 text-gray-600" />
                  "{activeDecision.reasoning}"
                </div>
              </div>

              {/* Trade-off Matrix */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Trade-off Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(activeDecision.tradeOffs).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg border border-white/5 bg-gradient-to-br from-white/5 to-transparent text-center hover:border-white/10 transition-colors">
                      <div className="text-[10px] uppercase text-gray-500 mb-2 tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className={`font-mono font-bold text-lg ${(value as string).includes('-') ? 'text-green-400' :
                          (value as string).includes('+') ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <Activity className="w-16 h-16 text-gray-800" />
            <p className="font-mono text-sm">SELECT A NEURAL EVENT TO DECRYPT</p>
          </div>
        )}
      </Card>
    </div>
  )
}