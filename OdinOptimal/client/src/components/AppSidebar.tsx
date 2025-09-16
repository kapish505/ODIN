import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar"
import { Home, Rocket, Shield, Brain, History, Settings, Globe, Target, Bot } from "lucide-react"
import { useLocation } from "wouter"
import { Link } from "wouter"

const menuItems = [
  { title: "Mission Control", url: "/dashboard", icon: Home },
  { title: "Trajectory Planning", url: "/trajectory", icon: Target },
  { title: "Autonomous Planner", url: "/autopilot", icon: Bot },
  { title: "Active Missions", url: "/dashboard", icon: Rocket },
  { title: "Threat Detection", url: "/threats", icon: Shield },
  { title: "AI Decisions", url: "/decisions", icon: Brain },
  { title: "Mission History", url: "/dashboard", icon: History },
  { title: "Global Settings", url: "/dashboard", icon: Globe },
  { title: "System Config", url: "/dashboard", icon: Settings },
]

export default function AppSidebar() {
  const [location] = useLocation()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-space-blue font-semibold">
            ODIN Navigator
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    data-active={location === item.url}
                    className="hover-elevate"
                  >
                    <Link 
                      href={item.url} 
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => console.log(`Navigated to ${item.title}`)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
