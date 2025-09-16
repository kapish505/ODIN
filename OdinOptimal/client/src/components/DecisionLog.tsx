import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Fuel,
  Timer,
  Shield
} from "lucide-react"

//todo: remove mock data
const mockDecisions = [
  {
    id: "DEC-001",
    timestamp: "2024-03-15T14:30:00Z",
    threatDetected: "Solar flare (X9.3 class)",
    originalTrajectory: "Direct Hohmann transfer",
    selectedTrajectory: "L1 Lagrange point route",
    reasoning: "Rerouting via L1 Lagrange point reduces radiation exposure by 90% with only 6-hour delay. The trade-off analysis shows significantly improved crew safety while maintaining acceptable mission timeline.",
    tradeOffs: {
      fuelCost: "+12%",
      travelTime: "+6 hours", 
      radiationReduction: "-90%",
      safetyScore: "+45%"
    },
    status: "Implemented",
    confidence: 94
  },
  {
    id: "DEC-002", 
    timestamp: "2024-03-14T09:15:00Z",
    threatDetected: "Space debris field (>10cm objects)",
    originalTrajectory: "Standard LEO departure",
    selectedTrajectory: "Modified inclination change",
    reasoning: "Debris collision probability exceeded 1:1000 threshold. Implemented 2.3° inclination adjustment during LEO phase to avoid high-density debris region. Maneuver requires minimal ΔV while ensuring safe corridor.",
    tradeOffs: {
      fuelCost: "+3%",
      travelTime: "+45 minutes",
      collisionRisk: "-85%", 
      safetyScore: "+30%"
    },
    status: "Completed",
    confidence: 98
  },
  {
    id: "DEC-003",
    timestamp: "2024-03-13T18:45:00Z", 
    threatDetected: "Communication blackout prediction",
    originalTrajectory: "Lunar polar approach",
    selectedTrajectory: "Equatorial insertion with relay",
    reasoning: "Solar storm predicted during critical insertion phase would cause 4-hour communication blackout. Alternative trajectory maintains ground contact via relay satellite, enabling real-time monitoring during LOI burn.",
    tradeOffs: {
      fuelCost: "+8%",
      travelTime: "+2 hours",
      communicationUptime: "+100%",
      safetyScore: "+25%"
    },
    status: "Active",
    confidence: 89
  }
]

export default function DecisionLog() {
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Implemented": return "success-green"
      case "Active": return "mission-orange"
      case "Completed": return "space-blue"
      case "Rejected": return "critical-red"
      default: return "neutral-gray"
    }
  }

  const getTradeOffIcon = (key: string) => {
    switch (key) {
      case "fuelCost": return Fuel
      case "travelTime": return Timer
      case "radiationReduction": 
      case "collisionRisk": return Shield
      case "safetyScore": return TrendingUp
      default: return TrendingUp
    }
  }

  const getTradeOffColor = (value: string) => {
    if (value.startsWith('+') && (value.includes('Cost') || value.includes('Time'))) return "critical-red"
    if (value.startsWith('-') && (value.includes('Reduction') || value.includes('Risk'))) return "success-green"
    if (value.startsWith('+') && value.includes('Score')) return "success-green"
    return "mission-orange"
  }

  const submitFeedback = () => {
    console.log('Submitting AI decision feedback:', feedback)
    setFeedback("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-mission-orange" />
            AI Decision History & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-mission-orange">12</div>
              <div className="text-sm text-muted-foreground">Total Decisions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-green">94%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-space-blue">2.3s</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Log */}
      <div className="space-y-4">
        {mockDecisions.map((decision) => {
          const isSelected = selectedDecision === decision.id
          
          return (
            <Card 
              key={decision.id}
              className={`hover-elevate cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-mission-orange' : ''
              }`}
              onClick={() => {
                setSelectedDecision(isSelected ? null : decision.id)
                console.log(`${isSelected ? 'Collapsed' : 'Expanded'} decision: ${decision.id}`)
              }}
              data-testid={`decision-${decision.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-mission-orange/20 text-mission-orange">
                        <Brain className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Decision {decision.id}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(decision.timestamp).toLocaleDateString()} {new Date(decision.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div className="font-mono font-bold">{decision.confidence}%</div>
                      <div className="text-muted-foreground">Confidence</div>
                    </div>
                    <Badge className={`bg-${getStatusColor(decision.status)}/20 text-${getStatusColor(decision.status)}`}>
                      {decision.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Threat Summary */}
                  <div className="bg-critical-red/10 border border-critical-red/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-critical-red" />
                      <span className="font-semibold text-critical-red">Threat Detected</span>
                    </div>
                    <div className="text-sm">{decision.threatDetected}</div>
                  </div>

                  {/* Decision Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Original Plan</div>
                      <div className="font-mono text-sm bg-muted/50 p-2 rounded">
                        {decision.originalTrajectory}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">AI Decision</div>
                      <div className="font-mono text-sm bg-mission-orange/10 p-2 rounded border border-mission-orange/20">
                        {decision.selectedTrajectory}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Reasoning */}
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">AI Reasoning</div>
                        <div className="text-sm bg-muted/30 p-3 rounded-lg leading-relaxed">
                          {decision.reasoning}
                        </div>
                      </div>

                      {/* Trade-offs */}
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Impact Analysis</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(decision.tradeOffs).map(([key, value]) => {
                            const Icon = getTradeOffIcon(key)
                            return (
                              <div key={key} className="text-center p-2 bg-muted/30 rounded-lg">
                                <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                <div className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className={`font-mono font-bold text-sm text-${getTradeOffColor(key)}`}>
                                  {value}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-mission-orange hover:bg-mission-orange/90" data-testid={`button-implement-${decision.id}`}>
                          Implement Decision
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-modify-${decision.id}`}>
                          Modify Parameters  
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-export-${decision.id}`}>
                          Export Analysis
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-mission-orange" />
            Provide AI Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Share your feedback on AI decision quality, reasoning, or suggestions for improvement..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-feedback"
            />
            <Button 
              onClick={submitFeedback}
              disabled={!feedback.trim()}
              className="bg-mission-orange hover:bg-mission-orange/90"
              data-testid="button-submit-feedback"
            >
              Submit Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}