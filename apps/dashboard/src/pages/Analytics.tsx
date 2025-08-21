import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProject } from "@/contexts/ProjectContext"
import { api } from "@/lib/api"
import type { AnalyticsResponse, DailyInteraction, FeedbackSummary } from "@/lib/types"
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { format, parseISO } from "date-fns"
import { useParams, useNavigate } from "react-router-dom"

const Analytics = () => {
  const { selectedProject, projects, selectProject } = useProject()
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedProject) {
        setError("No project selected")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await api.analytics.get(selectedProject.project_id)
        setAnalyticsData(data)
      } catch (err) {
        console.error("Error fetching analytics:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch analytics")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedProject])

  // Format daily interactions for chart
  const chartData = analyticsData?.daily_interactions.map(interaction => ({
    ...interaction,
    date: format(parseISO(interaction.date), "MMM dd"),
    day: format(parseISO(interaction.date), "EEE"),
  })) || []

  // Format feedback data for pie chart
  const feedbackData = analyticsData?.feedback_summary ? [
    { name: "Positive", value: analyticsData.feedback_summary.positive, color: "#8b5cf6" },
    { name: "Negative", value: analyticsData.feedback_summary.negative, color: "#f97316" },
  ] : []

  // Custom tooltip for area chart
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">Value: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>

      </div>

      {/* Daily Interactions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  name="Queries"
                />
                <Area
                  type="monotone"
                  dataKey="chats"
                  stackId="1"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.6}
                  name="Chats"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Interactions */}
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-medium">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent className="text-center flex flex-col justify-center flex-1">
            <div className="text-6xl font-bold">{analyticsData.total_interactions}</div>
            <p className="text-sm text-muted-foreground mt-3">
              {analyticsData.total_queries} queries, {analyticsData.total_chats} chats
            </p>
          </CardContent>
        </Card>

        {/* Feedback Assessment */}
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-medium">Feedback Assessment</CardTitle>
          </CardHeader>
          <CardContent className="text-center flex flex-col justify-center flex-1">
            <div className="text-6xl font-bold">
              {analyticsData.feedback_summary.total > 0 
                ? Math.round((analyticsData.feedback_summary.positive / analyticsData.feedback_summary.total) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-3">Positive</p>
          </CardContent>
        </Card>

        {/* Feedback Summary */}
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-medium">Feedback Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feedbackData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {feedbackData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {feedbackData.map((entry) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Analytics