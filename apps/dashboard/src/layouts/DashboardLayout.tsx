import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { ProfileDropdown } from "@/components/dashboard/ProfileDropdown"
import { ProjectHeader } from "@/components/dashboard/ProjectHeader"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b bg-background px-6">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-4">
                <ProjectHeader />
              </div>
            </div>
            <ProfileDropdown />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}