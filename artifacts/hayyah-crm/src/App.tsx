import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { useAuth } from "@/hooks/use-auth";

import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Orders from "@/pages/orders";
import Providers from "@/pages/providers";
import TaskHistoryPage from "@/pages/task-history";
import PricingRulesPage from "@/pages/pricing-rules";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ClearQueryCacheOnLogout() {
  const qc = useQueryClient();
  useEffect(() => {
    const onLogout = () => qc.clear();
    window.addEventListener("hayyah:logout", onLogout);
    return () => window.removeEventListener("hayyah:logout", onLogout);
  }, [qc]);
  return null;
}

function ProtectedRouter() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated && location !== "/login") {
    return <Redirect to="/login" />;
  }

  if (isAuthenticated && location === "/login") {
    return <Redirect to="/" />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/customers" component={Customers} />
      <Route path="/orders" component={Orders} />
      <Route path="/bookings"><Redirect to="/orders" /></Route>
      <Route path="/providers" component={Providers} />
      <Route path="/task-history" component={TaskHistoryPage} />
      <Route path="/pricing-rules" component={PricingRulesPage} />
      <Route path="/technicians"><Redirect to="/providers" /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClearQueryCacheOnLogout />
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/login" component={Login} />
            <Route component={ProtectedRouter} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
