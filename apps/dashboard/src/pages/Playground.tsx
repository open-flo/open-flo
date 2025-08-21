import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProject } from "@/contexts/ProjectContext"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"

const Playground = () => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Playground</h1>
        <p className="text-muted-foreground">
          Test and experiment with your configurations
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Playground Environment</CardTitle>
          <CardDescription>
            Playground features will be available here soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Playground