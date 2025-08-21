import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useProject } from "@/contexts/ProjectContext"
import { api } from "@/lib/api"
import { Navigation } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useParams, useNavigate } from "react-router-dom"
import NavigationManager from "@/components/NavigationManager"

const Navigations = () => {
  const { selectedProject, projects, selectProject } = useProject()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Navigation entries from backend
  const [navigations, setNavigations] = useState<Navigation[]>([])
  const [navigationLoading, setNavigationLoading] = useState(true)
  const [navigationRefreshing, setNavigationRefreshing] = useState(false)
  const [navigationError, setNavigationError] = useState<string | null>(null)

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

  // Load navigation entries when component mounts or project changes
  useEffect(() => {
    if (selectedProject) {
      loadNavigations()
    } else {
      setNavigations([])
      setNavigationLoading(false)
    }
  }, [selectedProject])

  const loadNavigations = async (isRefresh = false) => {
    if (!selectedProject) return

    try {
      if (isRefresh) {
        setNavigationRefreshing(true)
      } else {
        setNavigationLoading(true)
      }
      setNavigationError(null)
      
      const response = await api.navigations.list({
        project_id: selectedProject.project_id,
        limit: 100
      })

      if (response.success) {
        setNavigations(response.navigations)
        if (isRefresh) {
          toast({
            title: "Refreshed",
            description: `Loaded ${response.navigations.length} navigation entries`
          })
        }
      } else {
        setNavigationError(response.message || 'Failed to load navigation entries')
      }
    } catch (err) {
      console.error('Error loading navigation entries:', err)
      setNavigationError(err instanceof Error ? err.message : 'Failed to load navigation entries')
    } finally {
      setNavigationLoading(false)
      setNavigationRefreshing(false)
    }
  }

  const handleNavigationRefresh = () => {
    loadNavigations(true)
  }

  const deleteNavigationEntry = async (navigationId: string) => {
    try {
      const response = await api.navigations.delete(navigationId)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Navigation entry deleted successfully"
        })
        
        // Remove from local state
        setNavigations(prev => prev.filter(nav => nav.navigation_id !== navigationId))
      } else {
        throw new Error(response.message || 'Failed to delete navigation entry')
      }
    } catch (err) {
      console.error('Error deleting navigation entry:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete navigation entry',
        variant: "destructive"
      })
    }
  }

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigations</h1>
          <p className="text-muted-foreground">
            Manage your navigation entries
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project to manage navigation entries.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Navigations</h1>
        <p className="text-muted-foreground">
          Manage your navigation entries for {selectedProject.name}
        </p>
      </div>

      {navigationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{navigationError}</AlertDescription>
        </Alert>
      )}

      <NavigationManager 
        navigations={navigations}
        onDelete={deleteNavigationEntry}
        onRefresh={handleNavigationRefresh}
        loading={navigationLoading}
        refreshing={navigationRefreshing}
        projectId={selectedProject.project_id}
      />
    </div>
  )
}

export default Navigations
