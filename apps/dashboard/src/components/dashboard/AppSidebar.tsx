import { useState } from "react"
import { Settings, FileText, Users, Key, BarChart3, BookOpen, Gamepad2, FolderOpen, Sparkles, Search, Cog, Navigation } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useProject } from "@/contexts/ProjectContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"

const workspaceItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Knowledge", url: "/knowledge", icon: BookOpen },
  { title: "Navigations", url: "/navigations", icon: Navigation },
  { title: "Nudge Studio", url: "/nudge-studio", icon: Sparkles },
  { title: "Search Hook", url: "/search-hook", icon: Search },
  { title: "Workflows", url: "/workflows", icon: Cog },
  { title: "Settings", url: "/settings", icon: Settings },
]

// Removed API Keys from settingsItems
const settingsItems = [
  // { title: "User Management", url: "/settings/users", icon: Users },
  // { title: "API Keys", url: "/settings/api-keys", icon: Key },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const { selectedProject } = useProject()

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"

  // Generate project-specific URLs
  const getProjectUrl = (baseUrl: string) => {
    if (!selectedProject) return baseUrl
    const projectId = selectedProject.project_id
    return `/project/${projectId}${baseUrl === '/' ? '' : baseUrl}`
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-center">
          <img 
            src="/Logo-735-230.png" 
            alt="Flowvana Logo" 
            className="h-8 w-auto"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Projects Navigation - Always show */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/projects" className={getNavCls}>
                    <FolderOpen className="h-4 w-4" />
                    {!isCollapsed && <span>Projects</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspace Navigation - Only show when project is selected and not on projects or user management page */}
        {selectedProject && currentPath !== '/projects' && currentPath !== '/settings/users' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              WORKSPACE
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaceItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={getProjectUrl(item.url)} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Removed the ADMIN section since we're moving User Management to footer */}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            ADMIN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings/users" className={getNavCls}>
                    <Users className="h-4 w-4" />
                    {!isCollapsed && <span>User Management</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}