import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Heart, Thermometer } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Dashboard() {
  const { selectedOrgId } = useOrganization();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(
    undefined,
    { enabled: !!selectedOrgId }
  );
  const { data: favoriteHorses, isLoading: favoritesLoading } = trpc.dashboard.getFavoriteHorses.useQuery(
    undefined,
    { enabled: !!selectedOrgId }
  );
  const { data: upcomingCare, isLoading: careLoading } = trpc.dashboard.getUpcomingCare.useQuery(
    undefined,
    { enabled: !!selectedOrgId }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your horse health monitoring system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Horses</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeHorses || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Currently monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.averageHeartRate || 0} bpm</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              From recent sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.averageTemperature || 0}°C</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              From recent sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {stats?.activeAlerts || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              High/critical risk
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Favorite Horses */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Horses</CardTitle>
            <CardDescription>
              Quick access to your most monitored horses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : favoriteHorses && favoriteHorses.length > 0 ? (
              <div className="space-y-3">
                {favoriteHorses.map((horse) => (
                  <Link key={horse.id} href={`/horses/${horse.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">{horse.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {horse.breed || "Unknown breed"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          horse.status === "active"
                            ? "default"
                            : horse.status === "injured"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {horse.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No favorite horses yet</p>
                <p className="text-sm mt-1">
                  Mark horses as favorites to see them here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Care */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Care</CardTitle>
            <CardDescription>
              Scheduled health care tasks and appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {careLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingCare && upcomingCare.length > 0 ? (
              <div className="space-y-3">
                {upcomingCare.slice(0, 5).map((care) => (
                  <div
                    key={care.id}
                    className="flex items-start justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{care.careType}</p>
                      {care.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {care.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium">
                        {new Date(care.scheduledDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(care.scheduledDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No upcoming care scheduled</p>
                <p className="text-sm mt-1">
                  Schedule care tasks to see them here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

