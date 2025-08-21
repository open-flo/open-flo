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
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2,
  Link 
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { api } from '@/lib/api';
import type { 
  SearchHook, 
  CreateSearchHookRequest, 
  UpdateSearchHookRequest,
  SearchHookAuthConfig 
} from '@/lib/types';

interface FormData {
  name: string;
  url: string;
  auth_config: SearchHookAuthConfig;
  data_list_path: string;
  navigation_url_formula: string;
  navigation_title_formula: string;
}

const initialFormData: FormData = {
  name: '',
  url: '',
  auth_config: {
    type: 'Bearer',
    source: {
      from: 'cookie',
      name: ''
    }
  },
  data_list_path: '',
  navigation_url_formula: '',
  navigation_title_formula: ''
};

const SearchHooks: React.FC = () => {
  const { selectedProject } = useProject();
  const [searchHooks, setSearchHooks] = useState<SearchHook[]>([]);
  const [selectedHook, setSelectedHook] = useState<SearchHook | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load search hooks on component mount and project change
  useEffect(() => {
    if (selectedProject?.project_id) {
      loadSearchHooks();
    }
  }, [selectedProject]);

  const loadSearchHooks = async () => {
    if (!selectedProject?.project_id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.searchHooks.list({
        project_id: selectedProject.project_id
      });
      
      if (response.success) {
        setSearchHooks(response.search_hooks);
      } else {
        setError('Failed to load search hooks');
      }
    } catch (err) {
      console.error('Error loading search hooks:', err);
      setError('Failed to load search hooks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHookSelect = (hook: SearchHook) => {
    setSelectedHook(hook);
    setFormData({
      name: hook.name,
      url: hook.url,
      auth_config: hook.auth_config,
      data_list_path: hook.data_list_path,
      navigation_url_formula: hook.navigation_url_formula,
      navigation_title_formula: hook.navigation_title_formula
    });
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedHook(null);
    setFormData(initialFormData);
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (selectedHook) {
      setIsEditing(true);
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (selectedHook) {
      setFormData({
        name: selectedHook.name,
        url: selectedHook.url,
        auth_config: selectedHook.auth_config,
        data_list_path: selectedHook.data_list_path,
        navigation_url_formula: selectedHook.navigation_url_formula,
        navigation_title_formula: selectedHook.navigation_title_formula
      });
    } else {
      setFormData(initialFormData);
    }
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!selectedProject?.project_id) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isCreating) {
        const createData: CreateSearchHookRequest = {
          project_id: selectedProject.project_id,
          ...formData
        };
        
        const response = await api.searchHooks.create(createData);
        
        if (response.success) {
          setSuccess('Search hook created successfully');
          await loadSearchHooks();
          setIsCreating(false);
        } else {
          setError(response.message || 'Failed to create search hook');
        }
      } else if (selectedHook) {
        const updateData: UpdateSearchHookRequest = formData;
        
        const response = await api.searchHooks.update(selectedHook.search_hook_id, updateData);
        
        if (response.success) {
          setSuccess('Search hook updated successfully');
          await loadSearchHooks();
          setIsEditing(false);
          // Update selected hook
          if (response.search_hook) {
            setSelectedHook(response.search_hook);
          }
        } else {
          setError(response.message || 'Failed to update search hook');
        }
      }
    } catch (err) {
      console.error('Error saving search hook:', err);
      setError('Failed to save search hook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHook) return;

    if (!confirm('Are you sure you want to delete this search hook?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.searchHooks.delete(selectedHook.search_hook_id);
      
      if (response.success) {
        setSuccess('Search hook deleted successfully');
        await loadSearchHooks();
        setSelectedHook(null);
        setFormData(initialFormData);
        setIsEditing(false);
        setIsCreating(false);
      } else {
        setError(response.message || 'Failed to delete search hook');
      }
    } catch (err) {
      console.error('Error deleting search hook:', err);
      setError('Failed to delete search hook');
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

  const updateAuthConfig = (field: keyof SearchHookAuthConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      auth_config: {
        ...prev.auth_config,
        [field]: value
      }
    }));
  };

  const updateAuthSource = (field: 'from' | 'name', value: string) => {
    setFormData(prev => ({
      ...prev,
      auth_config: {
        ...prev.auth_config,
        source: {
          ...prev.auth_config.source,
          [field]: value
        }
      }
    }));
  };

  const isFormMode = isEditing || isCreating;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search Hook</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hooks List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Hooks
                </CardTitle>
                <Button size="sm" onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              <CardDescription>
                {searchHooks.length} hook{searchHooks.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && searchHooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading search hooks...
                </div>
              ) : searchHooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No search hooks configured yet. Create your first one!
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {searchHooks.map((hook) => (
                      <Card
                        key={hook.search_hook_id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedHook?.search_hook_id === hook.search_hook_id 
                            ? 'border-primary bg-muted/30' 
                            : ''
                        }`}
                        onClick={() => handleHookSelect(hook)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{hook.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Link className="h-3 w-3" />
                                {new URL(hook.url).hostname}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hook Details/Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {isCreating ? 'Create Search Hook' : selectedHook ? (isEditing ? 'Edit Search Hook' : selectedHook.name) : 'Select any Hook'}
                </CardTitle>
                {selectedHook && !isFormMode && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleEdit}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                {isFormMode && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedHook && !isCreating ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a search hook from the list to view or edit its details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="Enter hook name"
                        disabled={!isFormMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => updateFormData('url', e.target.value)}
                        placeholder="https://api.example.com/search?query=${query}"
                        disabled={!isFormMode}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Authentication Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Authentication</h3>
                    
                    <div>
                      <Label htmlFor="auth-type">Type</Label>
                      <Select
                        value={formData.auth_config.type}
                        onValueChange={(value: 'Bearer' | 'Basic') => updateAuthConfig('type', value)}
                        disabled={!isFormMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select auth type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bearer">Bearer</SelectItem>
                          <SelectItem value="Basic">Basic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="auth-source">Source</Label>
                      <Select
                        value={formData.auth_config.source.from}
                        onValueChange={(value: 'localstorage' | 'cookie') => updateAuthSource('from', value)}
                        disabled={!isFormMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="localstorage">Local Storage</SelectItem>
                          <SelectItem value="cookie">Cookie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="auth-name">
                        {formData.auth_config.source.from === 'cookie' ? 'Cookie Name' : 'Local Storage Key'}
                      </Label>
                      <Input
                        id="auth-name"
                        value={formData.auth_config.source.name}
                        onChange={(e) => updateAuthSource('name', e.target.value)}
                        placeholder={formData.auth_config.source.from === 'cookie' ? 'accessToken' : 'auth_token'}
                        disabled={!isFormMode}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Data Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Configuration</h3>
                    
                    <div>
                      <Label htmlFor="data-list-path">Data List Path</Label>
                      <Input
                        id="data-list-path"
                        value={formData.data_list_path}
                        onChange={(e) => updateFormData('data_list_path', e.target.value)}
                        placeholder="$.data"
                        disabled={!isFormMode}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JSONPath to the array of search results
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Navigation Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Navigation Configuration</h3>
                    
                    <div>
                      <Label htmlFor="nav-url">Navigation URL Formula</Label>
                      <Textarea
                        id="nav-url"
                        value={formData.navigation_url_formula}
                        onChange={(e) => updateFormData('navigation_url_formula', e.target.value)}
                        placeholder="https://example.com/item/${data['$.id']}"
                        disabled={!isFormMode}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        URL template for navigation, use ${`data['$.field']`} to reference result fields
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="nav-title">Navigation Title Formula</Label>
                      <Textarea
                        id="nav-title"
                        value={formData.navigation_title_formula}
                        onChange={(e) => updateFormData('navigation_title_formula', e.target.value)}
                        placeholder="${data['$.name']}"
                        disabled={!isFormMode}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Title template for navigation, use ${`data['$.field']`} to reference result fields
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SearchHooks;
