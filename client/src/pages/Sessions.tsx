import { trpc } from "@/lib/trpc";
import { Activity, Calendar, Heart, MapPin, Thermometer, ChevronLeft, ChevronRight } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";

export default function Sessions() {
  const { selectedOrgId } = useOrganization();
  const searchParams = useSearch();
  const horseIdFromUrl = new URLSearchParams(searchParams).get('horseId');
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7days");
  const [currentPage, setCurrentPage] = useState(1);
  const [horseFilter, setHorseFilter] = useState<number | undefined>(
    horseIdFromUrl ? parseInt(horseIdFromUrl) : undefined
  );

  useEffect(() => {
    if (horseIdFromUrl) {
      setHorseFilter(parseInt(horseIdFromUrl));
    }
  }, [horseIdFromUrl]);

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (dateFilter) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        return { startDate, endDate: now };
      case "30days":
        startDate.setDate(now.getDate() - 30);
        return { startDate, endDate: now };
      case "60days":
        startDate.setDate(now.getDate() - 60);
        return { startDate, endDate: now };
      case "90days":
        startDate.setDate(now.getDate() - 90);
        return { startDate, endDate: now };
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
      horseId: horseFilter,
      injuryRisk: riskFilter !== "all" ? riskFilter : undefined,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      limit: limit + 1, // Fetch one extra to check if there are more pages
      offset,
    },
    { enabled: !!selectedOrgId }
  );

  // Check if there are more pages
  const hasNextPage = sessions && sessions.length > limit;
  const displaySessions = sessions?.slice(0, limit) || [];
  const totalPages = Math.ceil((sessions?.length || 0) / limit);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, riskFilter, horseFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Sessions</h1>
        <p className="text-muted-foreground mt-1">
          View and analyze training session data and performance metrics
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Search by horse name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date range" />
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
              <SelectTrigger>
                <SelectValue placeholder="Filter by risk level" />
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
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : displaySessions && displaySessions.length > 0 ? (
          displaySessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold mb-1">
                      {(session as any).horseName || `Horse ID: ${session.horseId}`}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {(session as any).trackName || `Track ID: ${session.trackId}`}
                        {(session as any).trackType && ` (${(session as any).trackType})`}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getRiskColor(session.injuryRisk || "low")}>
                    {session.injuryRisk || "low"} risk
                  </Badge>
                </div>

                {session.performanceData && typeof session.performanceData === 'object' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(session.performanceData as any).duration && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">
                          {formatDuration((session.performanceData as any).duration)}
                        </p>
                      </div>
                    )}
                    {(session.performanceData as any).averageHeartRate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Avg Heart Rate</p>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <p className="text-sm font-medium">
                            {(session.performanceData as any).averageHeartRate} bpm
                          </p>
                        </div>
                      </div>
                    )}
                    {(session.performanceData as any).temperature && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Temperature</p>
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-blue-500" />
                          <p className="text-sm font-medium">
                            {(session.performanceData as any).temperature}°C
                          </p>
                        </div>
                      </div>
                    )}
                    {(session.performanceData as any).averageSpeed && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Avg Speed</p>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-green-500" />
                          <p className="text-sm font-medium">
                            {(session.performanceData as any).averageSpeed} km/h
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No training sessions found</p>
                <p className="text-sm mt-1">
                  {search || riskFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Training sessions will appear here"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {displaySessions && displaySessions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1} to {Math.min(offset + limit, offset + displaySessions.length)} sessions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

