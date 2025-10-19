import { Toaster } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import "@/lib/i18n"; // Initialize i18n
import Dashboard from "./pages/Dashboard";
import Horses from "./pages/Horses";
import Sessions from "./pages/Sessions";
import Tracks from "./pages/Tracks";
import Reports from "./pages/Reports";
import SessionDetail from "./pages/SessionDetail";
import Organizations from "./pages/Organizations";
import { Users } from "./pages/Users";
import InjuryRecords from "./pages/InjuryRecords";
import Profile from "./pages/Profile";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/horses" component={Horses} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/:id" component={SessionDetail} />
        <Route path="/tracks" component={Tracks} />
        <Route path="/injuries" component={InjuryRecords} />
        <Route path="/reports" component={Reports} />
        <Route path="/organizations" component={Organizations} />
        <Route path="/devices">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Devices</h2>
            <p className="text-muted-foreground">Device management page coming soon</p>
          </div>
        </Route>
        <Route path="/admin/users" component={Users} />
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
        <Route path="/profile" component={Profile} />
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
        <LocaleProvider>
          <OrganizationProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </OrganizationProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

