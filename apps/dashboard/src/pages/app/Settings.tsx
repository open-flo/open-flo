import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useProject } from "@/contexts/ProjectContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Save, Loader2, AlertCircle, Settings, Shield, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import type { ProjectAuthConfig, AuthConfig, AuthConfigSource } from "@/lib/types"
import { FloatingInput } from "@/components/ui/floating-input"

const AppSettings = () => {
  const { toast } = useToast()
  const { projectId } = useParams()
  const { selectedProject, projects, selectProject } = useProject()
  const navigate = useNavigate()
  
  // Auth configuration state
  const [authConfigs, setAuthConfigs] = useState<ProjectAuthConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Add auth config form state
  const [showAddAuth, setShowAddAuth] = useState(false)
  const [newAuthConfig, setNewAuthConfig] = useState({
    name: "",
    type: "Bearer" as const,
    sourceType: "localStorage" as "localStorage" | "cookie",
    key: "",
    path: ""
  })
  
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

  // Load auth configurations on component mount
  useEffect(() => {
    if (projectId) {
      loadAuthConfigs()
    }
  }, [projectId])

  const loadAuthConfigs = async () => {
    if (!projectId) {
      console.log('Auth Configs - No projectId provided')
      return
    }
    
    try {
      console.log('Auth Configs - Loading for project:', projectId)
      setIsLoading(true)
      setError(null)
      const response = await api.authConfigs.list({ project_id: projectId })
      console.log('Auth Configs - Received response:', response)
      
      if (response.success) {
        setAuthConfigs(response.auth_configs || [])
        console.log('Auth Configs - Successfully loaded:', response.auth_configs?.length || 0, 'configurations')
      } else {
        setError(response.message || "Failed to load auth configurations")
      }
    } catch (err) {
      console.error('Auth Configs - Exception occurred:', err)
      
      // Check if it's a 404 or endpoint not found error
      if (err instanceof Error && (err.message.includes('404') || err.message.includes('Not Found'))) {
        console.log('Auth Configs - API endpoint not found, using defaults')
        setAuthConfigs([])
        setError("Auth configuration API endpoint not available. Using default settings.")
      } else {
        const errorMsg = err instanceof Error ? err.message : "An error occurred while loading auth configurations"
        setError(`${errorMsg}. Please check if the backend server is running and the auth configs API is available.`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const addAuthConfig = async () => {
    if (!newAuthConfig.name.trim() || !newAuthConfig.key.trim()) {
      toast({
        title: "Invalid configuration",
        description: "Please provide both name and key for the auth configuration",
        variant: "destructive",
      })
      return
    }

    if (!projectId) return

    try {
      setIsSaving(true)
      
      const source: AuthConfigSource = {
        type: newAuthConfig.sourceType,
        key: newAuthConfig.key,
        ...(newAuthConfig.path ? { path: newAuthConfig.path } : {})
      }

      const authConfig: AuthConfig = {
        type: newAuthConfig.type,
        source
      }

      const response = await api.authConfigs.create({
        project_id: projectId,
        name: newAuthConfig.name,
        auth_config: authConfig
      })
      
      if (response.success) {
        // Reload configurations
        await loadAuthConfigs()
        
        setNewAuthConfig({
          name: "",
          type: "Bearer",
          sourceType: "localStorage",
          key: "",
          path: ""
        })
        setShowAddAuth(false)
        
        toast({
          title: "Auth configuration added",
          description: `Added auth configuration: ${newAuthConfig.name}`,
        })
      } else {
        toast({
          title: "Failed to add configuration",
          description: response.message || "Could not create auth configuration",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Failed to add configuration",
        description: err instanceof Error ? err.message : "An error occurred while adding configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const removeAuthConfig = async (authConfigId: string) => {
    try {
      setIsSaving(true)
      
      const response = await api.authConfigs.delete(authConfigId)
      
      if (response.success) {
        // Reload configurations
        await loadAuthConfigs()
        
        toast({
          title: "Auth configuration removed",
          description: "Auth configuration has been successfully removed",
        })
      } else {
        toast({
          title: "Failed to remove configuration",
          description: response.message || "Could not delete auth configuration",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Failed to remove configuration",
        description: err instanceof Error ? err.message : "An error occurred while removing configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedProject && !projectId) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No project selected. Please select a project to manage settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
      </div>

      {/* Auth Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Authentication Configurations</span>
          </CardTitle>
          <CardDescription>
            Configure authentication methods for API requests in your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddAuth(true)}
                  disabled={showAddAuth || isSaving}
                >
                  <Plus className="h-4 w-4" /> Add Configuration
                </Button>
              </div>

              {/* Add Auth Configuration Form */}
              {showAddAuth && (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Configuration Name */}
                      <div className="space-y-2">
                        <Label htmlFor="auth-name">Configuration Name</Label>
                        <FloatingInput
                          id="auth-name"
                          label="Configuration name"
                          placeholder="e.g., Cookie Auth, Simple Auth"
                          value={newAuthConfig.name}
                          onChange={(e) => setNewAuthConfig(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      {/* Auth Type */}
                      <div className="space-y-2">
                        <Label htmlFor="auth-type">Auth Type</Label>
                        <Select 
                          value={newAuthConfig.type} 
                          onValueChange={(value: "Bearer") => setNewAuthConfig(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select auth type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bearer">Bearer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Source Type */}
                        <div className="space-y-2">
                          <Label htmlFor="source-type">Source</Label>
                          <Select 
                            value={newAuthConfig.sourceType} 
                            onValueChange={(value: "localStorage" | "cookie") => setNewAuthConfig(prev => ({ 
                              ...prev, 
                              sourceType: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="localStorage">Local Storage</SelectItem>
                              <SelectItem value="cookie">Cookie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Key */}
                        <div className="space-y-2">
                          <Label htmlFor="auth-key">Key</Label>
                          <FloatingInput
                            id="auth-key"
                            label="Key name"
                            placeholder={newAuthConfig.sourceType === "cookie" ? "sessionToken" : "auth"}
                            value={newAuthConfig.key}
                            onChange={(e) => setNewAuthConfig(prev => ({ ...prev, key: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Path (for both localStorage and cookies) */}
                      <div className="space-y-2">
                        <Label htmlFor="auth-path">Path (Optional)</Label>
                        <FloatingInput
                          id="auth-path"
                          label="Path"
                          placeholder={newAuthConfig.sourceType === "cookie" ? "e.g., auth.token" : "e.g., user.token"}
                          value={newAuthConfig.path}
                          onChange={(e) => setNewAuthConfig(prev => ({ ...prev, path: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional path to extract value from nested {newAuthConfig.sourceType === "cookie" ? "cookie" : "localStorage"} structure
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={addAuthConfig} 
                          size="sm"
                          disabled={isSaving || !newAuthConfig.name.trim() || !newAuthConfig.key.trim()}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAddAuth(false)
                            setNewAuthConfig({
                              name: "",
                              type: "Bearer",
                              sourceType: "localStorage",
                              key: "",
                              path: ""
                            })
                          }}
                          size="sm"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Auth Configurations */}
              <div className="space-y-3">
                {authConfigs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No auth configurations</h3>
                    <p className="text-sm">Add an authentication configuration to get started</p>
                  </div>
                ) : (
                  authConfigs.map((config) => (
                    <div key={config.auth_config_id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                          <Shield className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{config.name}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {config.auth_config.type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Source:</span>
                              <Badge variant="outline" className="bg-white">
                                {config.auth_config.source.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Key:</span>
                              <Badge variant="outline" className="bg-white font-mono text-xs">
                                {config.auth_config.source.key}
                              </Badge>
                            </div>
                            {config.auth_config.source.path && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Path:</span>
                                <Badge variant="outline" className="bg-white font-mono text-xs">
                                  {config.auth_config.source.path}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAuthConfig(config.auth_config_id)}
                        className="text-destructive hover:text-destructive hover:bg-red-50"
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AppSettings