import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Link as LinkIcon, Trash2, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react"
import { useProject } from "@/contexts/ProjectContext"
import { api } from "@/lib/api"
import { KnowledgeEntry, IngestKnowledgeRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useParams, useNavigate } from "react-router-dom"

const Knowledge = () => {
  const { selectedProject, projects, selectProject } = useProject()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Knowledge entries from backend
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resyncingId, setResyncingId] = useState<string | null>(null)



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

  // Load knowledge entries when component mounts or project changes
  useEffect(() => {
    if (selectedProject) {
      loadKnowledgeEntries()
    } else {
      setKnowledgeEntries([])
      setLoading(false)
    }
  }, [selectedProject])

  const loadKnowledgeEntries = async (isRefresh = false) => {
    if (!selectedProject) return

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const response = await api.knowledge.list({
        project_id: selectedProject.project_id,
        limit: 100
      })

      if (response.success) {
        setKnowledgeEntries(response.knowledge_base)
        if (isRefresh) {
          toast({
            title: "Refreshed",
            description: `Loaded ${response.knowledge_base.length} knowledge entries`
          })
        }
      } else {
        setError(response.message || 'Failed to load knowledge entries')
      }
    } catch (err) {
      console.error('Error loading knowledge entries:', err)
      setError(err instanceof Error ? err.message : 'Failed to load knowledge entries')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadKnowledgeEntries(true)
  }



  const ingestUrl = async (url: string, title: string, type: "document" | "link" = "document") => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive"
      })
      return
    }

    if (!url || !title) {
      toast({
        title: "Error", 
        description: "Please provide both URL and title",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      const request: IngestKnowledgeRequest = {
        project_id: selectedProject.project_id,
        url,
        type,
        title,
        description: `${type === "document" ? "Document" : "Link"} added via dashboard`
      }

      const response = await api.knowledge.ingest(request)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Knowledge entry created successfully"
        })
        
        // Refresh knowledge entries
        await loadKnowledgeEntries()
      } else {
        throw new Error(response.message || 'Failed to ingest knowledge')
      }
    } catch (err) {
      console.error('Error ingesting knowledge:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to ingest knowledge',
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resyncKnowledgeEntry = async (knowledgeId: string) => {
    try {
      setResyncingId(knowledgeId)
      const response = await api.knowledge.resync(knowledgeId)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Knowledge entry resynced successfully"
        })
        
        // Refresh knowledge entries to show updated status
        await loadKnowledgeEntries()
      } else {
        throw new Error(response.message || 'Failed to resync knowledge entry')
      }
    } catch (err) {
      console.error('Error resyncing knowledge entry:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to resync knowledge entry',
        variant: "destructive"
      })
    } finally {
      setResyncingId(null)
    }
  }

  const deleteKnowledgeEntry = async (knowledgeId: string) => {
    try {
      const response = await api.knowledge.delete(knowledgeId)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Knowledge entry deleted successfully"
        })
        
        // Remove from local state
        setKnowledgeEntries(prev => prev.filter(entry => entry.knowledge_id !== knowledgeId))
      } else {
        throw new Error(response.message || 'Failed to delete knowledge entry')
      }
    } catch (err) {
      console.error('Error deleting knowledge entry:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete knowledge entry',
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

 

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage your documents
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project to manage knowledge base entries.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Manage your documents for {selectedProject.name}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DocumentManager 
        onIngest={(url, title) => ingestUrl(url, title, 'document')} 
        entries={knowledgeEntries}
        onDelete={deleteKnowledgeEntry}
        onResync={resyncKnowledgeEntry}
        onRefresh={handleRefresh}
        loading={loading}
        refreshing={refreshing}
        submitting={submitting}
        resyncingId={resyncingId}
      />
    </div>
  )
}

const DocumentManager = ({ 
  onIngest, 
  entries,
  onDelete,
  onResync,
  onRefresh,
  loading,
  refreshing,
  submitting,
  resyncingId
}: { 
  onIngest: (url: string, title: string) => void
  entries: KnowledgeEntry[]
  onDelete: (knowledgeId: string) => void
  onResync: (knowledgeId: string) => void
  onRefresh: () => void
  loading: boolean
  refreshing: boolean
  submitting: boolean
  resyncingId: string | null
}) => {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")

  const handleSubmit = () => {
    onIngest(url, title)
    setUrl("")
    setTitle("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              icon={<FileText className="h-4 w-4" />}
            />
            <FloatingInput
              label="Document URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              icon={<LinkIcon className="h-4 w-4" />}
            />
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={!url || !title || submitting} 
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {submitting ? 'Adding...' : 'Add Document'}
          </Button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Documents:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="hover:text-foreground"
              >
                {refreshing ? 'Refreshing...': 'Refresh'} <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : entries.length > 0 ? (
              entries.map((entry) => (
                <div key={entry.knowledge_id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(entry.status)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{entry.title || 'Untitled Document'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-md">{entry.url}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Last synced: {new Date(entry.updated_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResync(entry.knowledge_id)}
                      disabled={resyncingId === entry.knowledge_id}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <RefreshCw className={`h-4 w-4 ${resyncingId === entry.knowledge_id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(entry.knowledge_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No documents added yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



export default Knowledge