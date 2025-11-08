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
  const [sessionFilter, setSessionFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  
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

    updateSessionTrack.mutate({
      sessionIds: selectedSessions,
      trackId: selectedTrackId,
    });
  };

  const handleAssignToHorse = () => {
    if (!selectedHorseId) {
      toast.error("Please select a horse");
      return;
    }

    assignToHorse.mutate({
      sessionIds: selectedSessions,
      horseId: selectedHorseId === 0 ? null : selectedHorseId,
    });
  };

  const getDateRange = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case '7days':
        return {
          startDate: new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        };
      case '30days':
        return {
          startDate: new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        };
      case '60days':
        return {
          startDate: new Date(startOfToday.getTime() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        };
      case '90days':
        return {
          startDate: new Date(startOfToday.getTime() - 90 * 24 * 60 * 60 * 1000),
          endDate: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        };
      default: // 'all'
        return {
          startDate: new Date('1970-01-01'),
          endDate: new Date('2099-12-31')
        };
    }
  };

  const dateRange = getDateRange();

  // Filter sessions client-side
  const filteredSessions = displaySessions?.filter(session => {
    // Filter by assigned/unassigned
    if (sessionFilter === 'assigned' && !session.horseId) {
      return false;
    }
    if (sessionFilter === 'unassigned' && session.horseId) {
      return false;
    }
    
    // Filter by search
    const displayName = session.horseId ? session.horseName : 'new session';
    if (search && !displayName?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Filter by risk
    if (riskFilter !== "all" && session.injuryRisk !== riskFilter) {
      return false;
    }
    
    // Filter by date range
    const sessionDate = new Date(session.sessionDate);
    if (sessionDate < dateRange.startDate || sessionDate > dateRange.endDate) {
      return false;
    }
    
    return true;
  }) || [];

  // Sort unassigned sessions to top, then by date
  const sortedFilteredSessions = [...filteredSessions].sort((a, b) => {
    // Unassigned sessions always come first
    if (!a.horseId && b.horseId) return -1;
    if (a.horseId && !b.horseId) return 1;
    
    // Then sort by date (newest first)
    return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
  });

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

        <Button
          variant={sessionFilter === 'assigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSessionFilter('assigned')}
        >
          Assigned
        </Button>
        <Button
          variant={sessionFilter === 'unassigned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSessionFilter('unassigned')}
        >
          Unassigned
        </Button>
        <Button
          variant={sessionFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSessionFilter('all')}
        >
          All
        </Button>
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
          <Button
            size="sm"
            onClick={() => setShowAssignDialog(true)}
          >
            Assign to Track
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAssignHorseDialog(true)}
          >
            Assign to Horse
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-8">
                <input
                  type="checkbox"
                  checked={selectedSessions.length === sortedFilteredSessions.length && sortedFilteredSessions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Horse</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Risk</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Date ↓</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Duration</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Track</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground w-8"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4 border-b">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))}
              </>
            ) : sortedFilteredSessions.length > 0 ? (
              sortedFilteredSessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => setLocation(`/sessions/${session.id}`)}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">{session.horseId ? session.horseName : 'new session'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.injuryRisk ? (
                      <Badge variant={getRiskColor(session.injuryRisk) as any}>
                        {session.injuryRisk}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">no-data</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <div>{formatDateShort(session.sessionDate)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.sessionDate).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {session.performanceData && (session.performanceData as any).duration
                      ? `${Math.round((session.performanceData as any).duration / 60)} min`
                      : '—'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                    {session.trackName || '—'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSession.mutate({ id: session.id })}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  No sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Assign to Track Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Sessions to Track</DialogTitle>
            <DialogDescription>
              Select a country, track type, and then a track to assign {selectedSessions.length} session(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Country Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country..." />
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

            {/* Track Type Selection */}
            {countryFilter && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Track Type</Label>
                <Select value={trackTypeFilter} onValueChange={setTrackTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select track type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tracksByCountry(countryFilter, 'global').length > 0 && (
                      <SelectItem value="global">Global</SelectItem>
                    )}
                    {tracksByCountry(countryFilter, 'local').length > 0 && (
                      <SelectItem value="local">Local</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Track Selection */}
            {countryFilter && trackTypeFilter && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Track</Label>
                <Select value={selectedTrackId?.toString() || ''} onValueChange={(val) => setSelectedTrackId(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select track..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tracksByCountry(countryFilter, trackTypeFilter).map(track => (
                      <SelectItem key={track.id} value={track.id.toString()}>
                        {track.name}
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
              Select a horse to assign {selectedSessions.length} session(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="horse-select" className="text-sm font-medium mb-2 block">Horse</Label>
              <Select value={selectedHorseId?.toString() || ''} onValueChange={(val) => setSelectedHorseId(val === 'unassign' ? 0 : parseInt(val))}>
                <SelectTrigger id="horse-select">
                  <SelectValue placeholder="Select a horse..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Unassign from Horse</SelectItem>
                  {horses?.map(horse => (
                    <SelectItem key={horse.id} value={horse.id.toString()}>
                      {horse.name}
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
            <Button onClick={handleAssignToHorse} disabled={selectedHorseId === undefined}>
              Assign to Horse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

