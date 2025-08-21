import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { User, Building, Lock, Eye, EyeOff, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

const Profile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  
  // Profile form state
  const [userName, setUserName] = useState("");
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const { toast } = useToast();

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.auth.profile();
        setUserProfile(profile);
        setUserName(profile.name || "");
      } catch (error) {
        toast({
          title: "Error loading profile",
          description: error instanceof Error ? error.message : "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  const handleProfileUpdate = async () => {
    setIsUpdatingProfile(true);

    try {
      const response = await api.auth.updateProfile({ name: userName });
      
      if (response.success) {
        toast({
          title: "Profile updated",
          description: "Your name has been updated successfully.",
        });
        
        // Reload profile to get updated data
        const updatedProfile = await api.auth.profile();
        setUserProfile(updatedProfile);
        setIsNameModalOpen(false);
      } else {
        toast({
          title: "Update failed",
          description: response.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Invalid new password",
        description: "New password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await api.auth.updatePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });
      
      if (response.success) {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        });
        
        // Clear passwords and close modal
        setCurrentPassword("");
        setNewPassword("");
        setIsPasswordModalOpen(false);
      } else {
        toast({
          title: "Password update failed",
          description: response.message || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const openNameModal = () => {
    setUserName(userProfile?.name || "");
    setIsNameModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <div className="space-y-8">
          {/* Organization Name */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              Organization
            </label>
            <div className="text-lg">
              {userProfile?.company_name || "Not specified"}
            </div>
          </div>

          {/* User Name */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </label>
            
            <div className="flex items-center gap-2">
              <span className="text-lg">{userProfile?.name || "Not specified"}</span>
              <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openNameModal}
                    className="h-6 w-6 p-0 hover:bg-accent"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Name</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <FloatingInput
                      label="Full Name"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      icon={<User className="h-4 w-4" />}
                      required
                    />
                    <Button
                      onClick={handleProfileUpdate}
                      disabled={isUpdatingProfile || !userName}
                      className="w-full"
                    >
                      {isUpdatingProfile ? "Updating..." : "Update Name"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Password Update */}
          <div className="pt-4 border-t">
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <FloatingInput
                    label="Current Password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    endIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="hover:text-foreground transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    required
                  />
                  <FloatingInput
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    endIcon={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    required
                  />
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="w-full"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 