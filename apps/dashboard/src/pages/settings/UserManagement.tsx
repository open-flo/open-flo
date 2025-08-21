import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Mail, MoreHorizontal, Loader2, Copy, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import type { User } from "@/lib/types"

const UserManagement = () => {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [invitationResult, setInvitationResult] = useState<{
    inviteId: string;
    processedEmails: string[];
    failedEmails: string[];
  } | null>(null)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await api.auth.listUsers({ limit: 100 })
      
      if (response.success) {
        setUsers(response.users)
        setTotalCount(response.total_count)
      } else {
        toast({
          title: "Failed to load users",
          description: response.message || "Could not retrieve user list",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to load users",
        description: error instanceof Error ? error.message : "An error occurred while loading users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!email) return
    
    setIsInviting(true)
    setInvitationResult(null)
    
    try {
      const response = await api.auth.inviteUsers({
        emails: [email.trim()]
      })
      
      if (response.success) {
        toast({
          title: "Invitation sent successfully",
          description: `Invitation sent to ${email}`,
        })
        
        // Show invitation result with copy link functionality
        setInvitationResult({
          inviteId: response.invite_id!,
          processedEmails: response.processed_emails || [],
          failedEmails: response.failed_emails || []
        })
        
        setEmail("")
        
        // Reload users list to get updated data
        await loadUsers()
      } else {
        toast({
          title: "Failed to send invitation",
          description: response.message || "Could not send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "An error occurred while sending invitation",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const generateInvitationLink = (inviteId: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/auth/invitation?invite_id=${inviteId}`
  }

  const copyInvitationLink = async (inviteId: string) => {
    try {
      const invitationLink = generateInvitationLink(inviteId)
      await navigator.clipboard.writeText(invitationLink)
      setCopiedInviteId(inviteId)
      
      toast({
        title: "Invitation link copied",
        description: "The invitation link has been copied to your clipboard",
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedInviteId(null), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Could not copy invitation link to clipboard",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "pending": return "secondary"
      case "suspended": return "destructive"
      default: return "outline"
    }
  }

  const getUserInitials = (user: User) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Invite and manage team members
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to add a new team member to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={isInviting}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleInvite} disabled={!email || isInviting}>
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {isInviting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </div>

            {/* Invitation Result */}
            {invitationResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <strong>Invitation sent successfully!</strong>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Invitation Link:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInvitationLink(invitationResult.inviteId)}
                        className="h-8"
                      >
                        {copiedInviteId === invitationResult.inviteId ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {copiedInviteId === invitationResult.inviteId ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Share this link with the invited user to accept the invitation.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members ({totalCount})</CardTitle>
            <CardDescription>
              Manage your team members and their access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                <p>Invite your first team member to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.name || user.email.split('@')[0]}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Joined {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">
                        {user.role}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
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

export default UserManagement