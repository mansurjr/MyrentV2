import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Navigate, Outlet} from "react-router-dom";
import { useAuth } from "@/hooks/api/useAuth";
import { GlobalSidebar } from "@/components/GlobalSidebar";

export default function MainLayout() {
  const { logout, user, isUserLoading } = useAuth();

  if (isUserLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <AppHeader onLogout={logout} />
        <div className="flex flex-1 flex-col gap-4 p-4 min-w-0 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
      <GlobalSidebar />
    </SidebarProvider>
  );
}

