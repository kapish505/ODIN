import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  AlertTriangle, 
  Zap, 
  Satellite, 
  Radiation, 
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react"

//todo: remove mock data
const mockThreatData = [
  {
    id: "SOL-001",
    type: "Solar Flare",
    severity: "Low",
    probability: 15,
    timeToEvent: "6.2 hours",
    impact: "Minor communication disruption",
    recommendation: "Continue nominal operations"
  },
  {
    id: "DEB-002", 
    type: "Space Debris",
    severity: "Medium",
    probability: 8,
    timeToEvent: "2.1 hours",
    impact: "Collision risk with main engine",
    recommendation: "Execute avoidance maneuver at T+1:45"
  },
  {
    id: "RAD-003",
    type: "Radiation Exposure", 
    severity: "Low",
    probability: 25,
    timeToEvent: "Ongoing",
    impact: "Accumulated dose approaching limits",
    recommendation: "Monitor crew exposure levels"
  }
]

export default function ThreatMonitor() {
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null)
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Low": return "success-green"
      case "Medium": return "warning-amber"
      case "High": return "critical-red"
      case "Critical": return "critical-red"
      default: return "neutral-gray"
    }
  }

  const getThreatIcon = (type: string) => {
    switch (type) {
      case "Solar Flare": return Zap
      case "Space Debris": return Satellite
      case "Radiation Exposure": return Radiation
      default: return AlertTriangle
    }
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
                <p className="text-2xl font-bold text-success-green">Nominal</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-green" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-threats">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold text-warning-amber">3</p>
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
                <p className="text-2xl font-bold text-warning-amber">Medium</p>
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
              Active Threat Detection
            </CardTitle>
            <Button 
              variant={alertsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setAlertsEnabled(!alertsEnabled)
                console.log(`Threat alerts ${alertsEnabled ? 'disabled' : 'enabled'}`)
              }}
              data-testid="button-toggle-alerts"
            >
              {alertsEnabled ? "Alerts On" : "Alerts Off"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockThreatData.map((threat) => {
              const ThreatIcon = getThreatIcon(threat.type)
              const isSelected = selectedThreat === threat.id
              
              return (
                <div key={threat.id}>
                  <Card 
                    className={`hover-elevate cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-mission-orange' : ''
                    }`}
                    onClick={() => {
                      setSelectedThreat(isSelected ? null : threat.id)
                      console.log(`${isSelected ? 'Deselected' : 'Selected'} threat: ${threat.type}`)
                    }}
                    data-testid={`threat-${threat.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ThreatIcon className="w-5 h-5 text-mission-orange" />
                          <div>
                            <div className="font-semibold">{threat.type}</div>
                            <div className="text-sm text-muted-foreground">ID: {threat.id}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Probability</div>
                            <div className="font-mono font-bold">{threat.probability}%</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Time to Event</div>
                            <div className="font-mono font-bold">{threat.timeToEvent}</div>
                          </div>
                          
                          <Badge className={`bg-${getSeverityColor(threat.severity)}/20 text-${getSeverityColor(threat.severity)}`}>
                            {threat.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Impact Assessment</div>
                            <div className="text-sm">{threat.impact}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">AI Recommendation</div>
                            <div className="text-sm font-semibold text-mission-orange">{threat.recommendation}</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-mission-orange hover:bg-mission-orange/90" data-testid={`button-mitigate-${threat.id}`}>
                              Execute Mitigation
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-details-${threat.id}`}>
                              View Details
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

      {/* Historical Threats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-mission-orange" />
            Recent Threat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success-green" />
                <div>
                  <div className="font-medium">Solar Flare (X2.1)</div>
                  <div className="text-sm text-muted-foreground">2024-03-14 08:45 UTC</div>
                </div>
              </div>
              <Badge className="bg-success-green/20 text-success-green">Mitigated</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success-green" />
                <div>
                  <div className="font-medium">Debris Avoidance</div>
                  <div className="text-sm text-muted-foreground">2024-03-13 14:22 UTC</div>
                </div>
              </div>
              <Badge className="bg-success-green/20 text-success-green">Successful</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success-green" />
                <div>
                  <div className="font-medium">Communication Blackout</div>
                  <div className="text-sm text-muted-foreground">2024-03-12 20:15 UTC</div>
                </div>
              </div>
              <Badge className="bg-success-green/20 text-success-green">Resolved</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}