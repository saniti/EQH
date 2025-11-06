import { MapPin, Globe, Edit2, Trash2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { trpc } from "@/lib/trpc";

export default function Tracks() {
  const { selectedOrgId, selectedOrg } = useOrganization();
  const { user } = useAuth();
  const { isDemoMode, currentRole } = useDemoMode();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Determine effective user role (demo mode overrides actual role)
  const effectiveRole = isDemoMode ? currentRole : (user?.role || 'user');
  const isAdmin = effectiveRole === 'administrator';
  
  const deleteTrack = trpc.tracks.delete.useMutation({
    onSuccess: () => {
      toast.success("Track deleted successfully");
      trpc.useContext().tracks.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete track");
    },
  });
  
  const handleDeleteTrack = (trackId: number, trackName: string) => {
    if (confirm(`Are you sure you want to delete "${trackName}"?`)) {
      deleteTrack.mutate({ id: trackId });
    }
  };
  
  const { data: tracks, isLoading } = trpc.tracks.list.useQuery({});
  const { data: organizations } = trpc.organizations.list.useQuery();
  
  // Create a map of organization IDs to names
  const orgMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (organizations && Array.isArray(organizations)) {
      organizations.forEach(org => {
        if (org && org.id && org.name) {
          map[org.id] = org.name;
        }
      });
    }
    return map;
  }, [organizations]);
  
  // Debug: log the orgMap when it changes
  console.log('Organization map:', orgMap, 'Organizations:', organizations);

  const globalTracks = tracks?.filter(t => t.scope === 'global') || [];
  const localTracks = tracks?.filter(t => t.scope === 'local') || [];

  return (
    <div className="p-6 space-y-6 bg-background">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tracks for {selectedOrg?.name || 'Organization'}</h1>
        <p className="text-muted-foreground mt-1">
          Browse racetracks and training facilities available to {selectedOrg?.name || 'this organization'}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Search by track name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="racetrack">Racetracks</SelectItem>
                <SelectItem value="training">Training Facilities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tracks Tabs */}
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global">
            <Globe className="h-4 w-4 mr-2" />
            Global Tracks ({globalTracks.length})
          </TabsTrigger>
          <TabsTrigger value="local">
            <MapPin className="h-4 w-4 mr-2" />
            Organization Tracks ({localTracks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : globalTracks.length > 0 ? (
              globalTracks.map((track) => (
                <Card key={track.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{track.name}</h3>
                        {track.type && (
                          <p className="text-sm text-muted-foreground">{track.type}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {track.type && <Badge variant="outline">{track.type}</Badge>}
                          <Badge variant="secondary">Global</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {!isAdmin ? (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>Read-only</span>
                            </>
                          ) : (
                            <span className="text-green-600">Editable</span>
                          )}
                        </div>
                      </div>

                      {track.description && (
                        <div className="text-sm text-muted-foreground mt-2">
                          {track.description}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-12">
                  <div className="text-center text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No global tracks found</p>
                    <p className="text-sm mt-1">
                      {search ? "Try adjusting your search" : "Global tracks will appear here"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : localTracks.length > 0 ? (
              localTracks.map((track) => (
                <Card key={track.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{track.name}</h3>
                        {track.type && (
                          <p className="text-sm text-muted-foreground">{track.type}</p>
                        )}
                      </div>
                      
                      {/* Organization ownership */}
                      {track.organizationId && (
                        <div className="text-xs text-muted-foreground">
                          Owned by: <span className="font-medium">{orgMap[track.organizationId] || `Organization ${track.organizationId}`}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {track.type && <Badge variant="outline">{track.type}</Badge>}
                          <Badge variant="default">Organization</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => toast.info("Edit track feature coming soon")}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTrack(track.id, track.name)}
                            disabled={!isAdmin && effectiveRole !== 'owner'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {track.description && (
                        <div className="text-sm text-muted-foreground mt-2">
                          {track.description}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-12">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium">No organization tracks found</p>
                    <p className="text-sm mt-1">
                      {search ? "Try adjusting your search" : "Organization tracks will appear here"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

