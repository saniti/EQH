import { trpc } from "@/lib/trpc";
import { formatDateShort } from "@/lib/dateFormat";
import { Activity, Calendar, Heart, MapPin, Thermometer, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, Search } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";

export default function Sessions() {
  const { selectedOrgId, selectedOrg } = useOrganization();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  const horseIdFromUrl = new URLSearchParams(searchParams).get('horseId');
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("30days");
  const [currentPage, setCurrentPage] = useState(1);
  const [horseFilter, setHorseFilter] = useState<number | undefined>(
    horseIdFromUrl ? parseInt(horseIdFromUrl) : undefined
  );
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAssignHorseDialog, setShowAssignHorseDialog] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState<number | undefined>();
  const [selectedTrackId, setSelectedTrackId] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'date' | 'horse' | 'duration' | 'risk'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [trackTypeFilter, setTrackTypeFilter] = useState<string>("");
  useEffect(() => {
    if (horseIdFromUrl) {
      setHorseFilter(parseInt(horseIdFromUrl));
    }
  }, [horseIdFromUrl]);

  useEffect(() => {
    console.log('[Sessions] selectedOrgId changed to:', selectedOrgId);
    console.log('[Sessions] selectedOrg:', selectedOrg?.name);
  }, [selectedOrgId, selectedOrg]);



  const limit = 10;
  const offset = (currentPage - 1) * limit;

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    {
      organizationId: selectedOrgId!,
      horseId: horseFilter || undefined,
      limit: limit + 1, // Fetch one extra to check if there are more pages
      offset,
    },
    { enabled: !!selectedOrgId }
  );

  // Fetch available tracks
  const { data: tracks } = trpc.tracks.list.useQuery(
    { organizationId: selectedOrgId || undefined },
    { enabled: !!selectedOrgId }
  );

  // Fetch organization horses
  const { data: horses } = trpc.horses.list.useQuery(
    { organizationId: selectedOrgId!, limit: 100, offset: 0 },
    { enabled: !!selectedOrgId }
  );

  const utils = trpc.useUtils();

  const assignToHorse = trpc.sessions.assignToHorse.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate();
      setSelectedSessions([]);
      setShowAssignHorseDialog(false);
      setSelectedHorseId(undefined);
      toast.success("Sessions assigned to horse successfully");
    },
    onError: (error) => {
      toast.error(`Failed to assign sessions: ${error.message}`);
    },
  });

  const updateSessionTrack = trpc.sessions.updateTrack.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate();
      toast.success(`${selectedSessions.length} session(s) assigned to track`);
      setSelectedSessions([]);
      setShowAssignDialog(false);
      setSelectedTrackId(undefined);
      setCountryFilter("");
      setTrackTypeFilter("");
    },
    onError: (error: any) => {
      toast.error("Failed to assign sessions: " + error.message);
    },
  });

  const deleteSession = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate();
      toast.success("Session deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete session: " + error.message);
    },
  });

  // Check if there are more pages
  const hasNextPage = sessions && sessions.length > limit;
  const displaySessions = sessions?.slice(0, limit) || [];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSessions.length === displaySessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(displaySessions.map(s => s.id));
    }
  };

  const handleAssignToTrack = () => {
    if (!selectedTrackId) {
      toast.error("Please select a track");
      return;
    }
    // Update all selected sessions
    selectedSessions.forEach(sessionId => {
      updateSessionTrack.mutate({
        sessionId,
        trackId: selectedTrackId,
      });
    });
  };

  const handleAssignToHorse = () => {
    // Allow assigning to null (unassign)
    selectedSessions.forEach(sessionId => {
      assignToHorse.mutate({
        sessionId,
        horseId: selectedHorseId || null,
      });
    });
  };

  // Apply client-side filtering
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (dateFilter) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "60days":
        startDate.setDate(now.getDate() - 60);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "all":
        startDate = new Date(2000, 0, 1);
        break;
    }

    return { startDate, endDate };
  };

  const dateRange = getDateRange();

  // Filter sessions client-side
  const filteredSessions = displaySessions?.filter(session => {
    // Filter by search
    if (search && !session.horseName?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Filter by risk
    if (riskFilter !== "all" && session.riskLevel !== riskFilter) {
      return false;
    }
    
    // Filter by date range
    const sessionDate = new Date(session.sessionDate);
    if (sessionDate < dateRange.startDate || sessionDate > dateRange.endDate) {
      return false;
    }
    
    return true;
  }) || [];

  const globalTracks = tracks?.filter(t => t.scope === "global") || [];
  const localTracks = tracks?.filter(t => t.scope === "local") || [];
  
  // Group tracks by country
  const countries = Array.from(new Set(tracks?.map(t => t.country).filter(Boolean) as string[]) || []).sort();
  const tracksByCountry = (country: string, scope: string) => {
    return tracks?.filter(t => t.country === country && t.scope === scope) || [];
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Sessions for {selectedOrg?.name || 'Organization'}</h1>
        <p className="text-muted-foreground">
          View and analyze training session data and performance metrics for {selectedOrg?.name || 'this organization'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by horse name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="low">Low risk</SelectItem>
            <SelectItem value="medium">Medium risk</SelectItem>
            <SelectItem value="high">High risk</SelectItem>
            <SelectItem value="critical">Critical risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter Buttons */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-muted-foreground">Date:</span>
        <Button
          variant={dateFilter === '7days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('7days')}
        >
          7 days
        </Button>
        <Button
          variant={dateFilter === '30days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('30days')}
        >
          30 days
        </Button>
        <Button
          variant={dateFilter === '60days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('60days')}
        >
          60 days
        </Button>
        <Button
          variant={dateFilter === '90days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('90days')}
        >
          90 days
        </Button>
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateFilter('all')}
        >
          All time
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedSessions.length > 0 && (
        <div className="flex gap-2">
          <Button onClick={() => setShowAssignDialog(true)} variant="default" size="sm">
            Assign to Track
          </Button>
          <Button onClick={() => setShowAssignHorseDialog(true)} variant="secondary" size="sm">
            Assign to Horse
          </Button>
        </div>
      )}

      {/* Sessions Table */}
      {!isLoading && filteredSessions.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-8">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2">
                    {selectedSessions.length === filteredSessions.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                  <button
                    onClick={() => {
                      if (sortBy === 'horse') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('horse');
                        setSortOrder('asc');
                      }
                    }}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    Horse
                    {sortBy === 'horse' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                  Risk
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                  <button
                    onClick={() => {
                      if (sortBy === 'date') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('date');
                        setSortOrder('asc');
                      }
                    }}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    Date
                    {sortBy === 'date' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                  <button
                    onClick={() => {
                      if (sortBy === 'duration') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('duration');
                        setSortOrder('asc');
                      }
                    }}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    Duration
                    {sortBy === 'duration' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground hidden md:table-cell">
                  <button
                    onClick={() => {
                      if (sortBy === 'track') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('track');
                        setSortOrder('asc');
                      }
                    }}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    Track
                    {sortBy === 'track' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground w-8"></th>
              </tr>
            </thead>
            <tbody>

      {/* Sessions List */}
      {isLoading ? (
        <>
          {[1, 2, 3].map((i) => (
            <tr key={i}>
              <td colSpan={7} className="p-4 border-b">
                <Skeleton className="h-12 w-full" />
              </td>
            </tr>
          ))}
        </>
      ) : !isLoading && (!filteredSessions || filteredSessions.length === 0) ? (
        <tr>
          <td colSpan={7} className="p-8 text-center">
            <p className="text-muted-foreground">No sessions found for the selected filters.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your date range or filters.</p>
          </td>
        </tr>
      ) : filteredSessions && filteredSessions.length > 0 ? (
          [...filteredSessions].sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            switch (sortBy) {
              case 'date':
                return (new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()) * multiplier;
              case 'horse':
                return (a.horseName || '').localeCompare(b.horseName || '') * multiplier;
              case 'duration':
                return ((a.performanceData as any)?.duration || 0 - (b.performanceData as any)?.duration || 0) * multiplier;
              case 'risk':
                const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return ((riskOrder[(a.riskLevel as keyof typeof riskOrder) || 'low'] || 0) - (riskOrder[(b.riskLevel as keyof typeof riskOrder) || 'low'] || 0)) * multiplier;
              default:
                return 0;
            }
          }).map((session) => (
            <tr key={session.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleSessionSelection(session.id)}
                  className="flex items-center gap-2"
                >
                  {selectedSessions.includes(session.id) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="font-medium">{session.horseName || 'Unknown'}</div>
                {session.horseAlias && <div className="text-xs text-muted-foreground">{session.horseAlias}</div>}
              </td>
              <td className="px-4 py-3 text-sm">
                {session.riskLevel && (
                  <Badge variant={getRiskColor(session.riskLevel)}>
                    {session.riskLevel}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div>{formatDateShort(new Date(session.sessionDate))}</div>
                <div className="text-xs text-muted-foreground">{new Date(session.sessionDate).toLocaleTimeString()}</div>
              </td>
              <td className="px-4 py-3 text-sm">
                {(session.performanceData as any)?.duration ? `${(session.performanceData as any).duration} min` : '-'}
              </td>
              <td className="px-4 py-3 text-sm hidden md:table-cell">
                {session.trackName || '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => deleteSession.mutate(session.id)}
                  className="hover:text-destructive transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))
      ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {displaySessions && displaySessions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1} to {Math.min(offset + limit, offset + displaySessions.length)} sessions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Assign to Track Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open);
        if (!open) {
          setCountryFilter("");
          setTrackTypeFilter("");
          setSelectedTrackId(undefined);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Sessions to Track</DialogTitle>
            <DialogDescription>
              Assign {selectedSessions.length} selected session(s) to a track
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="font-medium mb-2 block">Step 1: Select Country</Label>
              <Select value={countryFilter} onValueChange={(v) => {
                setCountryFilter(v);
                setTrackTypeFilter("");
                setSelectedTrackId(undefined);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {countryFilter && (
              <div>
                <Label className="font-medium mb-2 block">Step 2: Select Track Type</Label>
                <Select value={trackTypeFilter} onValueChange={(v) => {
                  setTrackTypeFilter(v);
                  setSelectedTrackId(undefined);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select track type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global Track</SelectItem>
                    <SelectItem value="local">Local Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {countryFilter && trackTypeFilter && (
              <div>
                <Label className="font-medium mb-2 block">Step 3: Select Track</Label>
                <Select value={selectedTrackId?.toString()} onValueChange={(v) => setSelectedTrackId(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracksByCountry(countryFilter, trackTypeFilter).map(track => (
                      <SelectItem key={track.id} value={track.id.toString()}>
                        {track.name} {track.description ? `- ${track.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignToTrack} disabled={!selectedTrackId}>
              Assign to Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Horse Dialog */}
      <Dialog open={showAssignHorseDialog} onOpenChange={setShowAssignHorseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Sessions to Horse</DialogTitle>
            <DialogDescription>
              Select a horse to assign {selectedSessions.length} session(s) to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Horse</Label>
              <Select value={selectedHorseId?.toString()} onValueChange={(v) => setSelectedHorseId(v ? parseInt(v) : undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a horse or leave empty to unassign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassign from horse</SelectItem>
                  {horses?.map(horse => (
                    <SelectItem key={horse.id} value={horse.id.toString()}>
                      {horse.name} {horse.alias ? `(${horse.alias})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignHorseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignToHorse}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

