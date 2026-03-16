import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function Layout({ children }: { children: ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 sm:px-6 shadow-sm">
            <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground transition-colors" />
            <div className="flex flex-1 items-center justify-end gap-4">
               {/* Could add user profile / theme toggle here in the future */}
               <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm border border-primary/20">
                 AD
               </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background/50 p-4 sm:p-6 md:p-8 animate-in fade-in duration-500">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
