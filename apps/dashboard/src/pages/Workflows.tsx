import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Cog, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2,
  Play,
  Copy,
  Calendar,
  Settings,
  Sparkles
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { api } from '@/lib/api';
import type { 
  Workflow, 
  CreateWorkflowRequest, 
  UpdateWorkflowRequest,
  WorkflowInput,
  WorkflowStep,
  WorkflowAuth,
  WorkflowPayloadField,
  ImportWorkflowFromCurlRequest
} from '@/lib/types';

interface FormData {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, WorkflowInput>;
  steps: WorkflowStep[];
}

const initialFormData: FormData = {
  id: '',
  name: '',
  description: '',
  inputs: {},
  steps: []
};

const Workflows: React.FC = () => {
  const { selectedProject } = useProject();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Load workflows on component mount and project change
  useEffect(() => {
    if (selectedProject?.project_id) {
      loadWorkflows();
    }
  }, [selectedProject]);

  const loadWorkflows = async () => {
    if (!selectedProject?.project_id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.workflows.list({
        project_id: selectedProject.project_id
      });
      
      if (response.success) {
        setWorkflows(response.workflows);
      } else {
        setError('Failed to load workflows');
      }
    } catch (err) {
      console.error('Error loading workflows:', err);
      setError('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowSelect = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      inputs: workflow.inputs,
      steps: workflow.steps
    });
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setFormData(initialFormData);
    setIsCreating(true);
    setIsEditing(false);
    setCurlCommand('');
    setIsCreateDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedWorkflow) {
      setIsEditing(true);
      setIsCreating(false);
      setIsCreateDialogOpen(true);
    }
  };

  const handleCancel = () => {
    if (selectedWorkflow) {
      setFormData({
        id: selectedWorkflow.id,
        name: selectedWorkflow.name,
        description: selectedWorkflow.description,
        inputs: selectedWorkflow.inputs,
        steps: selectedWorkflow.steps
      });
    } else {
      setFormData(initialFormData);
    }
    setIsEditing(false);
    setIsCreating(false);
    setCurlCommand('');
    setIsCreateDialogOpen(false);
  };

  const handleImportFromCurl = async () => {
    if (!selectedProject?.project_id || !curlCommand.trim()) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const importData: ImportWorkflowFromCurlRequest = {
        curl_string: curlCommand.trim(),
        project_id: selectedProject.project_id
      };
      
      const response = await api.workflows.importFromCurl(importData);
      
      if (response.success) {
        setSuccess('Workflow imported from curl successfully!');
        await loadWorkflows();
        setIsCreating(false);
        setIsCreateDialogOpen(false);
        setCurlCommand('');
        
        // Select the newly imported workflow if available
        if (response.workflow) {
          setSelectedWorkflow(response.workflow);
        }
      } else {
        setError(response.message || 'Failed to import workflow from curl');
      }
    } catch (err) {
      console.error('Error importing workflow from curl:', err);
      setError('Failed to import workflow from curl');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProject?.project_id) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isCreating) {
        const createData: CreateWorkflowRequest = {
          project_id: selectedProject.project_id,
          ...formData
        };
        
        const response = await api.workflows.create(createData);
        
        if (response.success) {
          setSuccess('Workflow created successfully');
          await loadWorkflows();
          setIsCreating(false);
          setIsCreateDialogOpen(false);
        } else {
          setError(response.message || 'Failed to create workflow');
        }
      } else if (selectedWorkflow) {
        const updateData: UpdateWorkflowRequest = formData;
        
        const response = await api.workflows.update(selectedWorkflow.workflow_id, updateData);
        
        if (response.success) {
          setSuccess('Workflow updated successfully');
          await loadWorkflows();
          setIsEditing(false);
          setIsCreateDialogOpen(false);
          // Update selected workflow
          if (response.workflow) {
            setSelectedWorkflow(response.workflow);
          }
        } else {
          setError(response.message || 'Failed to update workflow');
        }
      }
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError('Failed to save workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;

    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.workflows.delete(selectedWorkflow.workflow_id);
      
      if (response.success) {
        setSuccess('Workflow deleted successfully');
        await loadWorkflows();
        setSelectedWorkflow(null);
        setFormData(initialFormData);
        setIsEditing(false);
        setIsCreating(false);
      } else {
        setError(response.message || 'Failed to delete workflow');
      }
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setError('Failed to delete workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isFormMode = isEditing || isCreating;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <Button onClick={handleCreateNew}>
            <Sparkles className="h-4 w-4 mr-2" />
            Import from cURL
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage automated workflows for your project
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Workflows Grid */}
      {isLoading && workflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Cog className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
          <p>Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Cog className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No workflows configured yet</p>
          <p className="mb-4">Create your first workflow to automate operations</p>
          <Button onClick={handleCreateNew}>
            <Sparkles className="h-4 w-4 mr-2" />
            Import from cURL
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card
              key={workflow.workflow_id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedWorkflow?.workflow_id === workflow.workflow_id 
                  ? 'border-primary shadow-md' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleWorkflowSelect(workflow)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{workflow.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {workflow.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkflowSelect(workflow);
                        handleEdit();
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkflow(workflow);
                        handleDelete();
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                                  <div className="space-y-3">
                  
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Settings className="h-3 w-3" />
                      <span>{Object.keys(workflow.inputs).length} input{Object.keys(workflow.inputs).length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Play className="h-3 w-3" />
                      <span>{workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(workflow.created_at)}</span>
                    </div>
                  </div>

                  {workflow.steps.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Steps:</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {workflow.steps[0].method}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">
                          {workflow.steps[0].name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCreating ? (
                <>
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Import Workflow from cURL
                </>
              ) : (
                'Edit Workflow'
              )}
            </DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Paste your cURL command and let AI automatically generate a workflow configuration'
                : 'Update the workflow configuration'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {isCreating ? (
              /* AI cURL Import Interface */
              <div className="space-y-4">
                <div className="space-y-3">

                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

                    
                    <div className="space-y-3">
                      <Label htmlFor="curl-command" className="text-sm font-medium">
                        cURL Command
                      </Label>
                      <Textarea
                        id="curl-command"
                        value={curlCommand}
                        onChange={(e) => setCurlCommand(e.target.value)}
                        placeholder="curl 'https://api.example.com/users' -X POST -H 'Content-Type: application/json' --data-raw '{&quot;name&quot;:&quot;John&quot;,&quot;email&quot;:&quot;john@example.com&quot;}'"
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded border text-xs text-gray-600">
                      <div className="font-medium mb-1">Example cURL command:</div>
                      <code className="block">
                        {`curl 'https://api.example.com/users' -X POST -H 'Content-Type: application/json' --data-raw '{"name":"John","email":"john@example.com"}'`}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Workflow Form */
              <>
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="workflow-name">Name</Label>
                      <Input
                        id="workflow-name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="Create a project"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workflow-description">Description</Label>
                      <Textarea
                        id="workflow-description"
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        placeholder="Create a project of given name"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Inputs Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Inputs</h3>
                  <div>
                    <Textarea
                      id="workflow-inputs"
                      value={JSON.stringify(formData.inputs, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateFormData('inputs', parsed);
                        } catch (err) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder="{}"
                      rows={Math.max(3, Math.min(20, JSON.stringify(formData.inputs, null, 2).split('\n').length + 1))}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <Separator />

                {/* Steps Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Steps</h3>
                  <div>
                    <Textarea
                      id="workflow-steps"
                      value={JSON.stringify(formData.steps, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateFormData('steps', parsed);
                        } catch (err) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder="[]"
                      rows={Math.max(3, Math.min(25, JSON.stringify(formData.steps, null, 2).split('\n').length + 1))}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {isCreating ? (
              <Button 
                onClick={handleImportFromCurl} 
                disabled={isImporting || !curlCommand.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isImporting && <Cog className="h-4 w-4 mr-2 animate-spin" />}
                <Sparkles className="h-4 w-4 mr-2" />
                Import from cURL
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Cog className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workflows;
