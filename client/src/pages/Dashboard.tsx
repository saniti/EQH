import { useEffect } from "react";
import { Activity, AlertTriangle, Heart, Thermometer } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { selectedOrgId, selectedOrg } = useOrganization();
  const utils = trpc.useUtils();
  
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(
    { organizationId: selectedOrgId },
    { enabled: !!selectedOrgId }
  );
  const { data: favoriteHorses, isLoading: favoritesLoading } = trpc.dashboard.getFavoriteHorses.useQuery(
    { organizationId: selectedOrgId },
    { enabled: !!selectedOrgId }
  );
  const { data: sessions, isLoading: sessionsLoading } = trpc.sessions.list.useQuery(
    { organizationId: selectedOrgId!, limit: 1000, offset: 0 },
    { enabled: !!selectedOrgId }
  );
  const unassignedSessionsCount = sessions?.filter(s => !s.horseId).length || 0;

  // Invalidate and refetch data when organization changes
  useEffect(() => {
    utils.dashboard.getStats.invalidate();
    utils.dashboard.getFavoriteHorses.invalidate();
  }, [selectedOrgId, utils]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {selectedOrg?.name || 'Organization'}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Needing Assignment</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-amber-600">
                  {unassignedSessionsCount}
                </div>
                <Badge variant="destructive">Assignment Needed</Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting horse assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Horse Statistics */}
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-0 shadow-none bg-muted/50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{stats?.activeHorses || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Horses</div>
              {statsLoading ? (
                <Skeleton className="h-2 w-10 mt-0.5 mx-auto" />
              ) : (
                <div className="text-xs text-green-600 mt-0.5">+{stats?.newHorses30Days || 0} new (30d)</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{stats?.trainingHorses || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Training Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{stats?.retiredHorses || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Retired Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{stats?.injuredHorses || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Injured Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{stats?.recentChanges30Days || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Recent Changes</div>
              {statsLoading ? (
                <Skeleton className="h-2 w-10 mt-0.5 mx-auto" />
              ) : (
                <div className="text-xs text-primary mt-0.5">{stats?.sessions30Days || 0} sessions</div>
              )}
            </div>
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


      </div>
    </div>
  );
}

