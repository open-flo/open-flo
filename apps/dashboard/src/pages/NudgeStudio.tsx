import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useProject } from "@/contexts/ProjectContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Copy, Check, Globe, Code, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { NudgePreview } from "@/components/NudgePreview"
import { ToolsSection } from "@/components/ToolsSection"

interface StudioConfig {
  config: any
  initialized: boolean
}

export default function NudgeStudio() {
  const { toast } = useToast()
  const { projectId } = useParams()
  const { selectedProject, projects, selectProject } = useProject()
  const navigate = useNavigate()
  
  const [studioConfig, setStudioConfig] = useState<StudioConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initUrl, setInitUrl] = useState("")
  const [showInitForm, setShowInitForm] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)

  const [currentConfig, setCurrentConfig] = useState<any>(null)

  // Handle project-specific routing
  useEffect(() => {
    if (projectId && !selectedProject) {
      const project = projects.find(p => p.project_id === projectId)
      if (project) {
        selectProject(project)
      } else {
        navigate('/projects')
      }
    }
  }, [projectId, selectedProject, projects, selectProject, navigate])

  // Load studio config on component mount
  useEffect(() => {
    if (projectId) {
      loadStudioConfig()
    }
  }, [projectId])

  const loadStudioConfig = async () => {
    if (!projectId) return
    
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.studio.getConfig(projectId)
      setStudioConfig({
        config: response.config,
        initialized: true
      })
      setCurrentConfig(response.config)
    } catch (error: any) {
      console.log('Studio config not found, showing init form')
      setShowInitForm(true)
    } finally {
      setIsLoading(false)
    }
  }

  const initializeStudioConfig = async () => {
    if (!projectId || !initUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    try {
      setIsInitializing(true)
      setError(null)
      
      const response = await api.studio.init({
        url: initUrl.trim(),
        project_id: projectId
      })
      
      setStudioConfig({
        config: response.config,
        initialized: true
      })
      setCurrentConfig(response.config)
      setShowInitForm(false)
      
      toast({
        title: "Success",
        description: "Studio configuration initialized successfully!",
      })
    } catch (error: any) {
      setError(error.message || 'Failed to initialize studio configuration')
      toast({
        title: "Error",
        description: error.message || 'Failed to initialize studio configuration',
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const generateCodeSnippet = () => {
    if (!currentConfig) return ""
    
    return `<script src="https://cdn.flowvana.tech/flowlight.umd.js"></script>

<script>
    // Initialize FlowLight with debug options
    const flowLightInstance = new FlowLight(
        ${JSON.stringify(currentConfig, null, 8)}
    );
</script>`
  }

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateCodeSnippet())
      setIsCopied(true)
      toast({
        title: "Copied!",
        description: "Code snippet copied to clipboard",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const updateConfig = (newConfig: any) => {
    setCurrentConfig(newConfig)
    // Update the studioConfig as well to keep them in sync
    setStudioConfig(prev => prev ? { ...prev, config: newConfig } : null)
  }

  const updateConfigField = (field: string, value: any) => {
    if (!currentConfig) return
    
    const newConfig = { ...currentConfig, [field]: value }
    updateConfig(newConfig)
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">Select a project</h2>
          <p className="text-muted-foreground">Choose a project to configure Nudge Studio</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
            {/* Header with Integration Code Button and Floating Sidebar */}
      {studioConfig && (
        <div className="flex justify-between items-center">
                    {/* Tools Section */}
          <ToolsSection 
            config={currentConfig} 
            onConfigUpdate={updateConfig}
            onConfigFieldUpdate={updateConfigField}
          />
          
          <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Integration Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader className="flex justify-between items-start">
                  <div>
                    <DialogTitle>Integration Code</DialogTitle>
                    <DialogDescription>
                      Add this code snippet to your website to enable Nudge Studio
                    </DialogDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCodeToClipboard}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                      <code>{generateCodeSnippet()}</code>
                    </pre>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Initialization Form */}
      {showInitForm && (
        <div className="flex justify-center items-center min-h-[400px]">
          <Card className="max-w-[60%] w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Initialize Studio Configuration
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={initUrl}
                onChange={(e) => setInitUrl(e.target.value)}
                disabled={isInitializing}
              />
            </div>
            <Button 
              onClick={initializeStudioConfig} 
              disabled={isInitializing || !initUrl.trim()}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing... (this may take few seconds)
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Initialize Configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Configuration Display */}
      {studioConfig && (
        <>
          {/* Preview iframe */}
          <Card className="w-full">
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <NudgePreview config={currentConfig} />
              </div>
            </CardContent>
          </Card>

                  </>
        )}
    </div>
    )
}