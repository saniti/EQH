import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Horses from "./pages/Horses";
import Sessions from "./pages/Sessions";
import Tracks from "./pages/Tracks";
import Reports from "./pages/Reports";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/horses" component={Horses} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/tracks" component={Tracks} />
        <Route path="/reports" component={Reports} />
        <Route path="/organizations">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Organizations</h2>
            <p className="text-muted-foreground">Organizations page coming soon</p>
          </div>
        </Route>
        <Route path="/devices">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Devices</h2>
            <p className="text-muted-foreground">Device management page coming soon</p>
          </div>
        </Route>
        <Route path="/care">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Upcoming Care</h2>
            <p className="text-muted-foreground">Care scheduling page coming soon</p>
          </div>
        </Route>
        <Route path="/admin/users">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">User Management</h2>
            <p className="text-muted-foreground">Admin user management page coming soon</p>
          </div>
        </Route>
        <Route path="/admin/invitations">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Invitations</h2>
            <p className="text-muted-foreground">User invitations page coming soon</p>
          </div>
        </Route>
        <Route path="/admin/requests">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Requests</h2>
            <p className="text-muted-foreground">Request management page coming soon</p>
          </div>
        </Route>
        <Route path="/admin/settings">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">API Settings</h2>
            <p className="text-muted-foreground">API configuration page coming soon</p>
          </div>
        </Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

