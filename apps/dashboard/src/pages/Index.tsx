import { useProject } from '@/contexts/ProjectContext'
import { ProjectGrid } from '@/components/dashboard/ProjectGrid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, BookOpen, Gamepad2, Settings, Users, Activity } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const Index = () => {
  const { selectedProject, projects, selectProject } = useProject()
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Handle project-specific routing
  useEffect(() => {
    if (projectId && !selectedProject) {
      const project = projects.find(p => p.project_id === projectId)
      if (project) {
        selectProject(project)
      } else {
        // Project not found, redirect to projects page
        navigate('/projects')
      }
    }
  }, [projectId, selectedProject, projects, selectProject, navigate])

  // Show project selection if no project is selected
  if (!selectedProject) {
    return <ProjectGrid />
  }

  // Show project dashboard when a project is selected
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to {selectedProject.name}</h1>
        <p className="text-muted-foreground mt-2">
          {selectedProject.description || 'Your project workspace for managing knowledge and analytics'}
        </p>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              of {selectedProject.settings.max_users_per_project} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              of {selectedProject.settings.max_flows_per_project} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              documents uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              reports generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/project/${selectedProject.project_id}/analytics`)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Analytics Dashboard</span>
            </CardTitle>
            <CardDescription>
              View detailed analytics and insights for your project
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/project/${selectedProject.project_id}/knowledge`)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Knowledge Base</span>
            </CardTitle>
            <CardDescription>
              Manage your project's knowledge and documentation
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/project/${selectedProject.project_id}/playground`)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span>Playground</span>
            </CardTitle>
            <CardDescription>
              Experiment and test your flows in a safe environment
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/project/${selectedProject.project_id}/settings`)}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Project Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your project settings and preferences
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Team Management</span>
            </CardTitle>
            <CardDescription>
              Invite and manage team members for this project
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Index;
