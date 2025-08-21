import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingInput } from "@/components/ui/floating-input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, User, UserCheck, Mail } from "lucide-react";
import { api } from "@/lib/api";

const Invitation = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [inviteId, setInviteId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extract invite ID from URL parameters
  useEffect(() => {
    const id = searchParams.get('invite_id');
    if (!id) {
      toast({
        title: "Invalid invitation",
        description: "No invitation ID found. Please check your invitation link.",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }
    setInviteId(id);
  }, [searchParams, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteId) {
      toast({
        title: "Invalid invitation",
        description: "No invitation ID found.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.auth.acceptInvite(inviteId, {
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });
      
      if (response.success) {
        toast({
          title: "Welcome to Flowvana!",
          description: "Your invitation has been accepted. Please sign in with your credentials.",
        });
        
        // Redirect to sign-in page after successful invitation acceptance
        navigate("/auth/login");
      } else {
        toast({
          title: "Invitation failed",
          description: response.message || "Failed to accept invitation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invitation failed",
        description: error instanceof Error ? error.message : "An error occurred while accepting invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the form until we have a valid invite ID
  if (!inviteId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
            <CardDescription>
              Validating your invitation
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">F</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join Flowvana. Complete your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAcceptInvitation} className="space-y-6">
            <FloatingInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <FloatingInput
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              icon={<User className="h-4 w-4" />}
              required
            />
            
            <div className="space-y-2">
              <FloatingInput
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />
              <p className="text-xs text-muted-foreground px-3">
                Must be at least 8 characters with numbers and special characters
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {isLoading ? "Accepting invitation..." : "Accept Invite"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invitation; 