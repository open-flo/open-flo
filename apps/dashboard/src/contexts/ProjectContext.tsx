import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Project, ListProjectsResponse } from '@/lib/types'
import { api } from '@/lib/api'

// Cookie helper function to get auth token
const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

interface ProjectContextType {
  selectedProject: Project | null
  projects: Project[]
  loading: boolean
  error: string | null
  selectProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: ReactNode
}

const PROJECT_STORAGE_KEY = 'selected_project'

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Load selected project from localStorage on init
  useEffect(() => {
    const storedProject = localStorage.getItem(PROJECT_STORAGE_KEY)
    if (storedProject) {
      try {
        setSelectedProject(JSON.parse(storedProject))
      } catch (err) {
        console.error('Failed to parse stored project:', err)
        localStorage.removeItem(PROJECT_STORAGE_KEY)
      }
    }
  }, [])

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated by trying to get auth token
      const token = getCookie('auth_token')
      if (!token) {
        setError('Authentication required')
        setProjects([])
        setLoading(false)
        return
      }
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const response = await Promise.race([
        api.projects.list({ status: 'active', limit: 100 }),
        timeoutPromise
      ]) as ListProjectsResponse
      
      if (response.success) {
        setProjects(response.projects)
        
        // If we have a stored project, verify it still exists and is active
        if (selectedProject) {
          const currentProject = response.projects.find(p => p.project_id === selectedProject.project_id)
          if (!currentProject || currentProject.status !== 'active') {
            // Clear invalid project
            setSelectedProject(null)
            localStorage.removeItem(PROJECT_STORAGE_KEY)
          } else if (JSON.stringify(currentProject) !== JSON.stringify(selectedProject)) {
            // Update project if it has changed
            setSelectedProject(currentProject)
            localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(currentProject))
          }
        }
        
        // Auto-select default project if no project is selected
        if (!selectedProject && response.projects.length > 0) {
          const defaultProject = response.projects.find(p => p.is_default) || response.projects[0]
          setSelectedProject(defaultProject)
          localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(defaultProject))
        }
      } else {
        setError('Failed to load projects')
        // Set empty projects array to prevent infinite loading
        setProjects([])
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      
      // Handle authentication expiration
      if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
        setError('Session expired. Please log in again.')
        setProjects([])
        setSelectedProject(null)
        localStorage.removeItem(PROJECT_STORAGE_KEY)
        // Use React Router to navigate to login
        navigate('/auth/login', { replace: true })
        return
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      // Set empty projects array to prevent infinite loading
      setProjects([])
      
      // Clear selected project if API fails
      if (selectedProject) {
        setSelectedProject(null)
        localStorage.removeItem(PROJECT_STORAGE_KEY)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedProject, navigate])

  // Load projects on component mount - only run once
  useEffect(() => {
    refreshProjects()
  }, []) // Empty dependency array - only run once on mount

  const selectProject = useCallback((project: Project | null) => {
    setSelectedProject(project)
    if (project) {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project))
    } else {
      localStorage.removeItem(PROJECT_STORAGE_KEY)
    }
  }, [])

  const value: ProjectContextType = {
    selectedProject,
    projects,
    loading,
    error,
    selectProject,
    refreshProjects,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
} 