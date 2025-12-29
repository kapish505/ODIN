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
import { Target, Orbit, Calculator, Download } from "lucide-react"
import { useLocation } from "wouter"
import { Link } from "wouter"

const menuItems = [
  { title: "Trajectory Planning", url: "/trajectory", icon: Target },
  { title: "Mission Presets", url: "/trajectory?preset=true", icon: Orbit },
  { title: "Delta-V Calculator", url: "/trajectory?calculator=true", icon: Calculator },
  { title: "Export Data", url: "/trajectory?export=true", icon: Download },
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
