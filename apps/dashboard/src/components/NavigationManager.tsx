import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Trash2, Globe, Plus, X, GripVertical } from "lucide-react"
import { Navigation, CreateNavigationRequest, UpdateNavigationRequest } from "@/lib/types"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface NavigationManagerProps {
  navigations: Navigation[]
  onDelete: (navigationId: string) => void
  onRefresh: () => void
  loading: boolean
  refreshing: boolean
  projectId: string
}

interface NavigationFormData {
  title: string
  url: string
  phrases: string[]
}

const NavigationManager = ({ 
  navigations,
  onDelete,
  onRefresh,
  loading,
  refreshing,
  projectId
}: NavigationManagerProps) => {
  const { toast } = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNavigation, setEditingNavigation] = useState<Navigation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<NavigationFormData>({
    title: '',
    url: '',
    phrases: ['']
  })

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      phrases: ['']
    })
    setEditingNavigation(null)
  }

  const openAddForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (navigation: Navigation) => {
    setEditingNavigation(navigation)
    setFormData({
      title: navigation.title,
      url: navigation.url,
      phrases: (navigation.phrases && navigation.phrases.length > 0) ? navigation.phrases : ['']
    })
    setIsFormOpen(true)
  }

  const updatePhrase = (index: number, value: string) => {
    const newPhrases = [...formData.phrases]
    newPhrases[index] = value
    setFormData({ ...formData, phrases: newPhrases })
  }

  const removePhrase = (index: number) => {
    const newPhrases = formData.phrases.filter((_, i) => i !== index)
    setFormData({ ...formData, phrases: newPhrases })
  }

  const addPhrase = () => {
    setFormData({ ...formData, phrases: [...formData.phrases, ''] })
  }

  const handleSubmit = async () => {
    if (!projectId || !formData.title || !formData.url) {
      toast({
        title: "Error",
        description: "Please provide both title and URL",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Filter out empty phrases
      const cleanedPhrases = formData.phrases.filter(phrase => phrase.trim() !== '')
      
      const request: CreateNavigationRequest = {
        project_id: projectId,
        url: formData.url,
        title: formData.title,
        phrases: cleanedPhrases
      }

      const response = await api.navigations.create(request)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Navigation created successfully"
        })
        
        // Refresh the navigation list
        onRefresh()
        
        // Close form and reset
        setIsFormOpen(false)
        resetForm()
      } else {
        throw new Error(response.message || 'Failed to create navigation')
      }
    } catch (err) {
      console.error('Error creating navigation:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create navigation',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingNavigation || !projectId || !formData.title || !formData.url) {
      toast({
        title: "Error",
        description: "Please provide both title and URL",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Filter out empty phrases
      const cleanedPhrases = formData.phrases.filter(phrase => phrase.trim() !== '')
      
      const request: UpdateNavigationRequest = {
        url: formData.url,
        title: formData.title,
        phrases: cleanedPhrases
      }

      const response = await api.navigations.update(
        editingNavigation.navigation_id,
        projectId,
        request
      )

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Navigation updated successfully"
        })
        
        // Refresh the navigation list
        onRefresh()
        
        // Close form and reset
        setIsFormOpen(false)
        resetForm()
      } else {
        throw new Error(response.message || 'Failed to update navigation')
      }
    } catch (err) {
      console.error('Error updating navigation:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update navigation',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Navigations</CardTitle>
            <CardDescription>
              View and manage browser navigation history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openAddForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Navigation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'} 
              <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : navigations.length > 0 ? (
            navigations.map((navigation) => (
              <div key={navigation.navigation_id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => openEditForm(navigation)}
                >
                  <Globe className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium hover:text-blue-600 transition-colors">{navigation.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-md hover:text-blue-500 transition-colors">{navigation.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(navigation.url, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(navigation.navigation_id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No navigations found.</p>
          )}
        </div>
      </CardContent>

      {/* Add/Edit Navigation Form */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-[600px] sm:w-[640px] lg:w-[800px] sm:max-w-none flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>
              {editingNavigation ? 'Edit Navigation' : 'Add Navigation'}
            </SheetTitle>
            <SheetDescription>
              {editingNavigation 
                ? 'Update the navigation details and phrases.' 
                : 'Add a new navigation entry with title, URL, and relevant phrases.'
              }
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 mt-6 pr-1 pl-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title..."
              />
            </div>

            {/* URL Field */}
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="URL..."
              />
            </div>

            {/* Phrases Field */}
            <div className="space-y-2">
              <Label>Phrases</Label>
              <div className="space-y-3">
                {formData.phrases.map((phrase, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Input
                      value={phrase}
                      onChange={(e) => updatePhrase(index, e.target.value)}
                      placeholder="Enter a phrase..."
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhrase(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      disabled={formData.phrases.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPhrase}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phrase
                </Button>
              </div>
            </div>

          </div>

          {/* Form Actions - Fixed at bottom */}
          <div className="flex-shrink-0 border-t pt-4 mt-4">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={editingNavigation ? handleUpdate : handleSubmit}
                disabled={!formData.title || !formData.url || isSubmitting}
              >
                {isSubmitting 
                  ? (editingNavigation ? 'Updating...' : 'Adding...') 
                  : (editingNavigation ? 'Update' : 'Add') + ' Navigation'
                }
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

export default NavigationManager
