import { useState } from "react"
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
  Clock,
  Loader2
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

interface Threat {
  activityID: string;
  messageType: string;
  messageBody: string;
  messageIssueTime: string;
}

export default function ThreatMonitor() {
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null)
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  const { data: notifications, isLoading, error } = useQuery<Threat[]>({
    queryKey: ["/api/weather/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/weather/notifications");
      return res.json();
    }
  });

  const threats = notifications || [];

  // Calculate dynamic stats
  const activeCount = threats.length;
  const overallStatus = activeCount > 5 ? "Critical" : activeCount > 2 ? "Elevated" : "Nominal";
  const threatLevel = activeCount > 5 ? "High" : activeCount > 2 ? "Medium" : "Low";

  const getSeverityColor = (type?: string) => {
    if (!type) return "neutral-gray";
    if (type.includes("FLR") || type.includes("CME")) return "warning-amber";
    if (type.includes("SEP")) return "critical-red";
    return "success-green";
  }

  const getThreatIcon = (type?: string) => {
    if (!type) return AlertTriangle;
    if (type.includes("FLR")) return Zap;       // Solar Flare
    if (type.includes("CME")) return Radiation; // Coronal Mass Ejection
    if (type.includes("SEP")) return Satellite; // Solar Energetic Particle
    return AlertTriangle;
  }

  const parseImpact = (body: string) => {
    // Simple extraction of summary or first sentence for UI
    const summary = body.split("## Summary:")[1]?.split("\n")[1] || body.substring(0, 100) + "...";
    return summary.trim();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-mission-orange" />
        <span className="ml-2 text-muted-foreground">Scanning deep space network...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-critical-red">
        <AlertTriangle className="w-8 h-8 mr-2" />
        <span>Failed to connect to NASA Deep Space Network.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Threat Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-overall-status">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Status</p>
                <p className={`text-2xl font-bold ${overallStatus === "Nominal" ? "text-success-green" : "text-warning-amber"}`}>
                  {overallStatus}
                </p>
              </div>
              <CheckCircle className={`w-8 h-8 ${overallStatus === "Nominal" ? "text-success-green" : "text-warning-amber"}`} />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-threats">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Notifications</p>
                <p className="text-2xl font-bold text-warning-amber">{activeCount}</p>
              </div>
              <Shield className="w-8 h-8 text-warning-amber" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-threat-level">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Threat Level</p>
                <p className="text-2xl font-bold text-warning-amber">{threatLevel}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning-amber" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Threats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-mission-orange" />
              Live Space Weather Feed (NASA DONKI)
            </CardTitle>
            <Button
              variant={alertsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
            >
              {alertsEnabled ? "Alerts On" : "Alerts Off"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCount === 0 && (
              <div className="text-center p-8 text-muted-foreground">No active space weather alerts reported.</div>
            )}
            {threats.map((threat) => {
              const ThreatIcon = getThreatIcon(threat.messageType)
              const isSelected = selectedThreat === threat.activityID
              const severityColor = getSeverityColor(threat.messageType);

              return (
                <div key={threat.activityID}>
                  <Card
                    className={`hover-elevate cursor-pointer transition-all ${isSelected ? 'ring-2 ring-mission-orange' : ''
                      }`}
                    onClick={() => setSelectedThreat(isSelected ? null : threat.activityID)}
                    data-testid={`threat-${threat.activityID}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ThreatIcon className="w-5 h-5 text-mission-orange" />
                          <div>
                            <div className="font-semibold">{threat.messageType}</div>
                            <div className="text-sm text-muted-foreground">ID: {threat.activityID.substring(0, 15)}...</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center hidden md:block">
                            <div className="text-sm text-muted-foreground">Issued</div>
                            <div className="font-mono font-bold text-sm">
                              {new Date(threat.messageIssueTime).toLocaleDateString()}
                            </div>
                          </div>

                          <Badge className={`bg-${severityColor}/20 text-${severityColor}`}>
                            Active
                          </Badge>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">NASA Report Summary</div>
                            <div className="text-sm whitespace-pre-line">{parseImpact(threat.messageBody)}</div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" className="bg-mission-orange hover:bg-mission-orange/90">
                              Assess Impact
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}