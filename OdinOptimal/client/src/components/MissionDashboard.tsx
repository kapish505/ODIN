import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Rocket, 
  Shield, 
  Brain, 
  Clock, 
  Fuel, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp 
} from "lucide-react"

//todo: remove mock data
const mockMissionData = {
  activeMissions: 3,
  completedMissions: 12,
  threatLevel: "Low",
  fuelEfficiency: 94,
  systemStatus: "Operational"
}

//todo: remove mock data 
const mockActiveMissions = [
  {
    id: "ODIN-001",
    name: "Artemis Support Mission",
    status: "Active",
    progress: 78,
    launchDate: "2024-03-15",
    arrivalDate: "2024-03-18",
    threatLevel: "Low"
  },
  {
    id: "ODIN-002", 
    name: "Lunar Resource Survey",
    status: "Planning",
    progress: 45,
    launchDate: "2024-04-22",
    arrivalDate: "2024-04-25",
    threatLevel: "Medium"
  },
  {
    id: "ODIN-003",
    name: "Communication Relay",
    status: "Active", 
    progress: 89,
    launchDate: "2024-02-28",
    arrivalDate: "2024-03-03",
    threatLevel: "Low"
  }
]

export default function MissionDashboard() {
  const [selectedMission, setSelectedMission] = useState(mockActiveMissions[0].id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "success-green"
      case "Planning": return "warning-amber"  
      case "Completed": return "space-blue"
      default: return "neutral-gray"
    }
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case "Low": return "success-green"
      case "Medium": return "warning-amber"
      case "High": return "critical-red"
      default: return "neutral-gray"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-active-missions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Missions</p>
                <p className="text-2xl font-bold">{mockMissionData.activeMissions}</p>
              </div>
              <Rocket className="w-8 h-8 text-mission-orange" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-system-status">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold text-success-green">{mockMissionData.systemStatus}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-green" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-threat-level">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Threat Level</p>
                <p className="text-2xl font-bold text-success-green">{mockMissionData.threatLevel}</p>
              </div>
              <Shield className="w-8 h-8 text-success-green" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-fuel-efficiency">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fuel Efficiency</p>
                <p className="text-2xl font-bold">{mockMissionData.fuelEfficiency}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Details */}
      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="missions" data-testid="tab-missions">Active Missions</TabsTrigger>
          <TabsTrigger value="planning" data-testid="tab-planning">Trajectory Planning</TabsTrigger>
          <TabsTrigger value="threats" data-testid="tab-threats">Threat Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4">
          <div className="grid gap-4">
            {mockActiveMissions.map((mission) => (
              <Card 
                key={mission.id} 
                className={`hover-elevate cursor-pointer transition-all ${
                  selectedMission === mission.id ? 'ring-2 ring-mission-orange' : ''
                }`}
                onClick={() => {
                  setSelectedMission(mission.id)
                  console.log(`Selected mission: ${mission.name}`)
                }}
                data-testid={`mission-card-${mission.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{mission.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Mission ID: {mission.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`bg-${getStatusColor(mission.status)}/20 text-${getStatusColor(mission.status)}`}>
                        {mission.status}
                      </Badge>
                      <Badge className={`bg-${getThreatColor(mission.threatLevel)}/20 text-${getThreatColor(mission.threatLevel)}`}>
                        {mission.threatLevel} Threat
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Mission Progress</span>
                        <span>{mission.progress}%</span>
                      </div>
                      <Progress value={mission.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Launch: {mission.launchDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-muted-foreground" />
                        <span>Arrival: {mission.arrivalDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-${mission.id}`}>
                        View Details
                      </Button>
                      <Button size="sm" className="bg-mission-orange hover:bg-mission-orange/90" data-testid={`button-modify-${mission.id}`}>
                        Modify Trajectory
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-mission-orange" />
                AI Trajectory Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Advanced trajectory optimization using Lambert's problem solver and AI-driven decision making.
                </p>
                <div className="grid gap-4">
                  <Button className="bg-mission-orange hover:bg-mission-orange/90" data-testid="button-new-trajectory">
                    <Rocket className="w-4 h-4 mr-2" />
                    Plan New Trajectory
                  </Button>
                  <Button variant="outline" data-testid="button-optimization">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Fuel Optimization Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-mission-orange" />
                Real-time Threat Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success-green">
                  <CheckCircle className="w-5 h-5" />
                  <span>All systems normal - No active threats detected</span>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Solar Activity Level:</span>
                    <Badge className="bg-success-green/20 text-success-green">Low</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Space Debris Risk:</span>
                    <Badge className="bg-success-green/20 text-success-green">Minimal</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Radiation Exposure:</span>
                    <Badge className="bg-warning-amber/20 text-warning-amber">Moderate</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}