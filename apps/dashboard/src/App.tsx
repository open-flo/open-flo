import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { ProjectProvider } from "@/contexts/ProjectContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";
import AppSettings from "./pages/app/Settings";
import Knowledge from "./pages/app/Knowledge";
import UserManagement from "./pages/settings/UserManagement";
import ApiKeys from "./pages/settings/ApiKeys";
import Analytics from "./pages/Analytics";
import Playground from "./pages/Playground";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Invitation from "./pages/auth/Invitation";
import Projects from "./pages/Projects";
import NudgeStudio from "./pages/NudgeStudio";
import SearchHooks from "./pages/SearchHooks";
import Workflows from "./pages/Workflows";
import Navigations from "./pages/Navigations";

const queryClient = new QueryClient();

const App = () => {
  // Initialize authentication state on app start
  useEffect(() => {
    api.auth.initializeAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProjectProvider>
            <Routes>
              {/* Global routes */}
              <Route path="/" element={<DashboardLayout><Projects /></DashboardLayout>} />
              {/* <Route path="/dashboard" element={<DashboardLayout><Index /></DashboardLayout>} /> */}
              <Route path="/projects" element={<DashboardLayout><Projects /></DashboardLayout>} />
              <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
              <Route path="/settings/users" element={<DashboardLayout><UserManagement /></DashboardLayout>} />
              
              {/* Auth routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/invitation" element={<Invitation />} />
              
              {/* Project-specific routes */}
              <Route path="/project/:projectId" element={<DashboardLayout><Analytics /></DashboardLayout>} />
              <Route path="/project/:projectId/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
              <Route path="/project/:projectId/knowledge" element={<DashboardLayout><Knowledge /></DashboardLayout>} />
              <Route path="/project/:projectId/navigations" element={<DashboardLayout><Navigations /></DashboardLayout>} />
              <Route path="/project/:projectId/nudge-studio" element={<DashboardLayout><NudgeStudio /></DashboardLayout>} />
              <Route path="/project/:projectId/playground" element={<DashboardLayout><Playground /></DashboardLayout>} />
              <Route path="/project/:projectId/search-hook" element={<DashboardLayout><SearchHooks /></DashboardLayout>} />
              <Route path="/project/:projectId/workflows" element={<DashboardLayout><Workflows /></DashboardLayout>} />
              <Route path="/project/:projectId/settings" element={<DashboardLayout><AppSettings /></DashboardLayout>} />
            
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProjectProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
