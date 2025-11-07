import { trpc } from "@/lib/trpc";
import { formatDateShort } from "@/lib/dateFormat";
import { Activity, Calendar, Heart, MapPin, Thermometer, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2 } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    if (horseIdFromUrl) {
      setHorseFilter(parseInt(horseIdFromUrl));
    }
  }, [horseIdFromUrl]);

  useEffect(() => {
    console.log('[Sessions] selectedOrgId changed to:', selectedOrgId);
    console.log('[Sessions] selectedOrg:', selectedOrg?.name);
  }, [selectedOrgId, selectedOrg]);

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    
    switch (dateFilter) {
      case "7days": {
        const startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0); // Start of day
        return { startDate, endDate };
      }
      case "30days": {
        const startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
      case "60days": {
        const startDate = new Date();
        startDate.setDate(now.getDate() - 60);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
      case "90days": {
        const startDate = new Date();
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
      }
      case "all":
        return { startDate: undefined, endDate: undefined };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const dateRange = getDateRange();
  const limit = 20;
  const offset = (currentPage - 1) * limit;
  
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    {
      organizationId: selectedOrgId!,
      horseId: horseFilter,
      injuryRisk: riskFilter !== "all" ? riskFilter : undefined,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
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
    { organizationId: selectedOrgId || 0 },
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

  const globalTracks = tracks?.filter(t => t.scope === "global") || [];
  const localTracks = tracks?.filter(t => t.scope === "local") || [];

  return (
    <div className="p-6 space-y-6 bg-background">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Sessions for {selectedOrg?.name || 'Organization'}</h1>
        <p className="text-muted-foreground">
          View and analyze training session data and performance metrics for {selectedOrg?.name || 'this organization'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by horse name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="60days">Last 60 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[180px]">
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

        {selectedSessions.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={() => setShowAssignDialog(true)} variant="default">
              Assign {selectedSessions.length} to Track
            </Button>
            <Button onClick={() => setShowAssignHorseDialog(true)} variant="secondary">
              Assign {selectedSessions.length} to Horse
            </Button>
          </div>
        )}
        

      </div>

      {/* Select All Checkbox */}
      {displaySessions.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedSessions.length === displaySessions.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>
              {selectedSessions.length === displaySessions.length
                ? "Deselect all"
                : "Select all"}
            </span>
          </button>
          {selectedSessions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({selectedSessions.length} selected)
            </span>
          )}
        </div>
      )}

      {/* Sessions Table Header */}
      {displaySessions && displaySessions.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-8"></th>
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
                  <button
                    onClick={() => {
                      if (sortBy === 'risk') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('risk');
                        setSortOrder('asc');
                      }
                    }}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    Risk
                    {sortBy === 'risk' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                  <button
                    onClick={() => {
                      if (sortBy === 'date') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('date');
                        setSortOrder('desc');
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
                <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
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
      ) : !isLoading && (!displaySessions || displaySessions.length === 0) ? (
        <tr>
          <td colSpan={7} className="p-8 text-center">
            <p className="text-muted-foreground">No sessions found for the selected filters.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your date range or filters.</p>
          </td>
        </tr>
      ) : displaySessions && displaySessions.length > 0 ? (
          [...displaySessions].sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            switch (sortBy) {
              case 'date':
                return (new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()) * multiplier;
              case 'horse':
                return (a.horseName || '').localeCompare(b.horseName || '') * multiplier;
              case 'duration':
                return ((a.performanceData as any)?.duration || 0 - (b.performanceData as any)?.duration || 0) * multiplier;
              case 'risk':
                const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, null: 0 };
                const aRisk = riskOrder[a.injuryRisk as keyof typeof riskOrder] || 0;
                const bRisk = riskOrder[b.injuryRisk as keyof typeof riskOrder] || 0;
                return (aRisk - bRisk) * multiplier;
              default:
                return 0;
            }
          }).map((session) => {
            const isSelected = selectedSessions.includes(session.id);
            return (
              <tr
                key={session.id}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSessionSelection(session.id)}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setLocation(`/sessions/${session.id}`)}
                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                      {session.horseName || 'Unassigned'}
                    </h3>
                    {session.horseAlias && (
                      <p className="text-xs text-muted-foreground">{session.horseAlias}</p>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Badge className={getRiskColor(session.injuryRisk || "low")}>
                    {session.injuryRisk || "low"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  {formatDateShort(session.sessionDate)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {session.performanceData?.duration 
                    ? `${Math.floor(session.performanceData.duration / 3600)}h ${Math.floor((session.performanceData.duration % 3600) / 60)}m`
                    : "—"}
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                  {session.trackName || `Track #${session.trackId}`}
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
            );
          })
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
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Sessions to Track</DialogTitle>
            <DialogDescription>
              Assign {selectedSessions.length} selected session(s) to a track
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">Global Tracks</h4>
              <Select value={selectedTrackId?.toString()} onValueChange={(v) => setSelectedTrackId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a global track" />
                </SelectTrigger>
                <SelectContent>
                  {globalTracks.map(track => (
                    <SelectItem key={track.id} value={track.id.toString()}>
                      {track.name} {track.description ? `- ${track.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-medium mb-2">Organization Tracks</h4>
              <Select value={selectedTrackId?.toString()} onValueChange={(v) => setSelectedTrackId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization track" />
                </SelectTrigger>
                <SelectContent>
                  {localTracks.map(track => (
                    <SelectItem key={track.id} value={track.id.toString()}>
                      {track.name} {track.description ? `- ${track.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              Assign {selectedSessions.length} selected session(s) to a horse in your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium mb-2">Select Horse</h4>
              <Select value={selectedHorseId?.toString() || "unassigned"} onValueChange={(v) => setSelectedHorseId(v === "unassigned" ? undefined : parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a horse or leave unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {horses?.map(horse => (
                    <SelectItem key={horse.id} value={horse.id.toString()}>
                      {horse.name} - {horse.breed}
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
              Assign to Horse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

