import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { Plus, RefreshCw, Trash2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import type { ApiKeyInfo } from "@/lib/types"

const ApiKeys = () => {
  const { toast } = useToast()
  const [keyName, setKeyName] = useState("")
  const [keyDescription, setKeyDescription] = useState("")
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshingKeys, setRefreshingKeys] = useState<Set<string>>(new Set())
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [refreshedApiKey, setRefreshedApiKey] = useState<{key: string, name: string} | null>(null)

  // Function to refresh API keys list
  const refreshApiKeys = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true)
    }
    try {
      const response = await api.apiKeys.list()
      if (response.success) {
        // Handle both possible response structures
        const keys = response.keys || (response as any).api_keys || []
        setApiKeys(Array.isArray(keys) ? keys : [])
        if (showRefreshing) {
          toast({
            title: "API Keys refreshed",
            description: "Successfully refreshed API keys list",
            duration: 2000,
          })
        }
      } else {
        toast({
          title: "Error loading API keys",
          description: "Failed to load API keys",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error loading API keys",
        description: error instanceof Error ? error.message : "Failed to load API keys",
        variant: "destructive",
      })
    } finally {
      if (showRefreshing) {
        setIsRefreshing(false)
      }
    }
  }, [toast])

  // Load API keys on component mount
  useEffect(() => {
    const loadApiKeys = async () => {
      setIsLoading(true)
      try {
        await refreshApiKeys()
      } finally {
        setIsLoading(false)
      }
    }

    loadApiKeys()
  }, [refreshApiKeys])

  const generateApiKey = async () => {
    if (!keyName) return
    
    setIsCreating(true)
    try {
      const response = await api.apiKeys.create({
        name: keyName,
        description: keyDescription || undefined,
        expires_in_days: 90, // Default to 90 days
      })
      
      if (response.success && response.key_id) {
        // Store the new API key to show to user
        setNewApiKey(response.api_key || null)
        
        // Clear form
        setKeyName("")
        setKeyDescription("")
        
        // Refresh the API keys list
        await refreshApiKeys()
        
        toast({
          title: "API Key generated",
          description: `New API key "${keyName}" has been created`,
          duration: 3000,
        })
      } else {
        toast({
          title: "Error creating API key",
          description: response.message || "Failed to create API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error creating API key",
        description: error instanceof Error ? error.message : "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const revokeApiKey = useCallback(async (keyId: string) => {
    const key = apiKeys.find(k => k.key_id === keyId)
    
    try {
      const response = await api.apiKeys.delete(keyId)
      
      if (response.success) {
        // Refresh the API keys list to get the latest state
        await refreshApiKeys()
        
        toast({
          title: "API Key revoked",
          description: `API key "${key?.name}" has been revoked`,
          variant: "destructive",
          duration: 3000,
        })
      } else {
        toast({
          title: "Error revoking API key",
          description: response.message || "Failed to revoke API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error revoking API key",
        description: error instanceof Error ? error.message : "Failed to revoke API key",
        variant: "destructive",
      })
    }
  }, [apiKeys, refreshApiKeys, toast])

  const refreshIndividualApiKey = useCallback(async (keyId: string) => {
    const key = apiKeys.find(k => k.key_id === keyId)
    if (!key) return
    
    setRefreshingKeys(prev => new Set(prev).add(keyId))
    
    try {
      const response = await api.apiKeys.refresh(keyId)
      
      if (response.success && response.api_key) {
        // Store the refreshed API key to show to user
        setRefreshedApiKey({ key: response.api_key, name: key.name })
        
        // Refresh the API keys list to get updated data
        await refreshApiKeys()
        
        toast({
          title: "API Key refreshed",
          description: `API key "${key.name}" has been refreshed`,
          duration: 3000,
        })
      } else {
        toast({
          title: "Error refreshing API key",
          description: response.message || "Failed to refresh API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error refreshing API key",
        description: error instanceof Error ? error.message : "Failed to refresh API key",
        variant: "destructive",
      })
    } finally {
      setRefreshingKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(keyId)
        return newSet
      })
    }
  }, [apiKeys, refreshApiKeys, toast])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">
          Generate and manage your API keys
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="API Key Name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  icon={<Copy className="h-4 w-4" />}
                  required
                />
                <FloatingInput
                  label="Description (optional)"
                  value={keyDescription}
                  onChange={(e) => setKeyDescription(e.target.value)}
                  placeholder="What is this key for?"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={generateApiKey} 
                  disabled={!keyName || isCreating} 
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreating ? "Generating..." : "Generate Key"}
                </Button>
              </div>
            </div>

            {/* Show newly created API key */}
            {newApiKey && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  New API Key Created!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Please copy this API key now. You won't be able to see it again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-green-100 dark:bg-green-900/40 p-2 rounded text-sm font-mono text-green-800 dark:text-green-200">
                    {newApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newApiKey)
                      toast({
                        title: "Copied to clipboard",
                        description: "New API key copied",
                        duration: 3000,
                      })
                      setNewApiKey(null)
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Show refreshed API key */}
            {refreshedApiKey && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  API Key Refreshed!
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Your API key "{refreshedApiKey.name}" has been refreshed. Please copy the new key now!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-blue-100 dark:bg-blue-900/40 p-2 rounded text-sm font-mono text-blue-800 dark:text-blue-200">
                    {refreshedApiKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(refreshedApiKey.key)
                      toast({
                        title: "Copied to clipboard",
                        description: `Refreshed API key "${refreshedApiKey.name}" copied`,
                        duration: 3000,
                      })
                      setRefreshedApiKey(null)
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading API keys...</div>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Copy className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p>No API keys found. Create your first API key above.</p>
              </div>
            ) : (
                              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.key_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{apiKey.name}</div>
                      {apiKey.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {apiKey.description}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>Created: {new Date(apiKey.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshIndividualApiKey(apiKey.key_id)}
                        disabled={refreshingKeys.has(apiKey.key_id)}
                        title="Refresh API Key"
                      >
                        <RefreshCw className={`h-3 w-3 ${refreshingKeys.has(apiKey.key_id) ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeApiKey(apiKey.key_id)}
                        title="Delete API Key"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ApiKeys