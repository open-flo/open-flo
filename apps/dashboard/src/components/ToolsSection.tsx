import { useState } from "react"
import { BookOpen, Palette, GripVertical, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ToolsSectionProps {
  config: any
  onConfigUpdate: (newConfig: any) => void
  onConfigFieldUpdate: (field: string, value: any) => void
}

export function ToolsSection({ config, onConfigUpdate, onConfigFieldUpdate }: ToolsSectionProps) {
  const { toast } = useToast()

  // Default suggested questions
  const defaultSuggestions = [
    "What services do you offer?",
    "How do I track my shipments?", 
    "What are your customs brokerage services?",
    "Can I get real-time shipment updates?",
    "Do you offer ocean and air freight solutions?",
    "What is your fulfillment process like?"
  ]

  // Get current suggestions from config or use defaults
  const currentSuggestions = config?.suggestedQuestions || defaultSuggestions

  const updateSuggestions = (newSuggestions: string[]) => {
    onConfigFieldUpdate('suggestedQuestions', newSuggestions)
  }

  const updateSuggestion = (index: number, value: string) => {
    const newSuggestions = [...currentSuggestions]
    newSuggestions[index] = value
    updateSuggestions(newSuggestions)
  }

  const removeSuggestion = (index: number) => {
    const newSuggestions = currentSuggestions.filter((_: string, i: number) => i !== index)
    updateSuggestions(newSuggestions)
  }

  const addSuggestion = () => {
    const newSuggestions = [...currentSuggestions, ""]
    updateSuggestions(newSuggestions)
  }

  const tools = [
    {
      id: 'suggestions',
      name: 'Suggestions',
      icon: BookOpen,
      title: 'Suggest Questions to your Users',
      description: 'Suggested questions are example prompts that help guide your users on what they can ask your Cell.',
      content: (
        <div className="space-y-4">
          
          <div className="space-y-3">
            {currentSuggestions.map((suggestion: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <Input
                  value={suggestion}
                  onChange={(e) => updateSuggestion(index, e.target.value)}
                  placeholder="Enter a suggested question..."
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSuggestion(index)}
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addSuggestion}
              className="w-full mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'design',
      name: 'Design',
      icon: Palette,
      title: 'Design Settings',
      description: 'Customize colors, themes, and visual design',
      content: (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Color Palette Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Color Palette</h4>
            
            {/* Primary Color */}
            <div>
              <Label className="text-xs">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="color" 
                  value={config?.themeColors?.primary || "#3B82F6"}
                  onChange={(e) => onConfigFieldUpdate('themeColors', { 
                    ...config?.themeColors, 
                    primary: e.target.value 
                  })}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input 
                  type="text" 
                  value={config?.themeColors?.primary || "#3B82F6"}
                  onChange={(e) => onConfigFieldUpdate('themeColors', { 
                    ...config?.themeColors, 
                    primary: e.target.value 
                  })}
                  className="flex-1 text-xs"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          {/* Layout Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Layout</h4>
            
            <div>
              <Label className="text-xs">Button Size</Label>
              <Input 
                type="number" 
                value={config?.buttonSize || 60}
                onChange={(e) => onConfigFieldUpdate('buttonSize', parseInt(e.target.value))}
                placeholder="60"
                min="30"
                max="100"
                className="text-xs"
              />
            </div>
            
            <div>
              <Label className="text-xs">Button Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Bottom (px)</Label>
                  <Input 
                    type="number"
                    value={config?.buttonPosition?.bottom || 20}
                    onChange={(e) => onConfigFieldUpdate('buttonPosition', { 
                      ...config?.buttonPosition, 
                      bottom: parseInt(e.target.value) 
                    })}
                    placeholder="20"
                    min="0"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Right (px)</Label>
                  <Input 
                    type="number"
                    value={config?.buttonPosition?.right || 20}
                    onChange={(e) => onConfigFieldUpdate('buttonPosition', { 
                      ...config?.buttonPosition, 
                      right: parseInt(e.target.value) 
                    })}
                    placeholder="20"
                    min="0"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Border Radius</Label>
              <Input 
                type="number" 
                value={config?.borderRadius || 8}
                onChange={(e) => onConfigFieldUpdate('borderRadius', parseInt(e.target.value))}
                placeholder="8"
                min="0"
                max="50"
                className="text-xs"
              />
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              toast({
                title: "Design Updated",
                description: "Design settings have been applied to the preview",
              })
            }}
          >
            Apply Design
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex items-center gap-6">
      {tools.map((tool) => (
        <div key={tool.id} className="relative flex flex-col items-center gap-1 group">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-primary hover:text-primary-foreground"
            title={tool.name}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground text-center">{tool.name}</span>
          
          {/* Floating Configuration Modal */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <Card className="w-80 shadow-lg border">
              <CardHeader>
              </CardHeader>
              <CardContent>
                {tool.content}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
      
      {/* Future tools can be added here */}
    </div>
  )
}