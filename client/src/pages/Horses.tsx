import { trpc } from "@/lib/trpc";
import { formatDateTimeShort } from "@/lib/dateFormat";
import { Heart, Plus, Search, Edit2, ArrowUpDown, Clock, Activity, TrendingUp, Users, AlertTriangle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Horses() {
  const { selectedOrgId, selectedOrg } = useOrganization();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latestSession");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingHorseId, setEditingHorseId] = useState<number | null>(null);
  const [showAddHorseDialog, setShowAddHorseDialog] = useState(false);
  const [newHorseForm, setNewHorseForm] = useState({
    name: '',
    alias: '',
    breed: '',
  });
  const [editForm, setEditForm] = useState({
    name: "",
    alias: "",
    breed: "",
    weight: "",
    owner: "",
    rider: "",
    birthPlace: "",
    location: "",
    color: "",
    gender: "",
  });

  const { data: horses, isLoading } = trpc.horses.list.useQuery(
    {
      organizationId: selectedOrgId!,
      search: search || undefined,
      limit: 100,
      offset: 0,
    },
    { enabled: !!selectedOrgId, refetchOnWindowFocus: false }
  );

  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.horses.getStats.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: !!selectedOrgId, refetchOnWindowFocus: false }
  );

  // Invalidate stats when organization changes
  useEffect(() => {
    utils.horses.getStats.invalidate();
    utils.horses.list.invalidate();
  }, [selectedOrgId, utils]);

  const [, setLocation] = useLocation();

  const addFavorite = trpc.horses.addFavorite.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      utils.horses.getStats.invalidate();
    },
  });

  const removeFavorite = trpc.horses.removeFavorite.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      utils.horses.getStats.invalidate();
    },
  });

  const updateHorse = trpc.horses.update.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      utils.horses.getStats.invalidate();
      setEditingHorseId(null);
    },
  });

  const createHorse = trpc.horses.create.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      utils.horses.getStats.invalidate();
      setShowAddHorseDialog(false);
      setNewHorseForm({ name: '', alias: '', breed: '' });
    },
  });

  // Get favorite IDs from horses data
  const favoriteHorses = horses?.filter(h => (h as any).isFavorite) || [];
  const nonFavoriteHorses = horses?.filter(h => !(h as any).isFavorite) || [];
  
  // Check if user has profile data
  const hasUserProfile = true; // Profile is now implemented
  
  // Sort horses based on selected option
  const sortHorses = (horseList: any[]) => {
    const sorted = [...horseList];
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case "latestSession":
        return sorted.sort((a, b) => {
          const aDate = a.latestSession?.sessionDate ? new Date(a.latestSession.sessionDate).getTime() : 0;
          const bDate = b.latestSession?.sessionDate ? new Date(b.latestSession.sessionDate).getTime() : 0;
          return (bDate - aDate) * multiplier;
        });
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name) * multiplier);
      case "duration":
        return sorted.sort((a, b) => {
          const aDuration = (a.latestSession?.performanceData as any)?.duration || 0;
          const bDuration = (b.latestSession?.performanceData as any)?.duration || 0;
          return (aDuration - bDuration) * multiplier;
        });
      case "risk":
        return sorted.sort((a, b) => {
          const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, null: 0 };
          const aRisk = riskOrder[a.latestSession?.injuryRisk as keyof typeof riskOrder] || 0;
          const bRisk = riskOrder[b.latestSession?.injuryRisk as keyof typeof riskOrder] || 0;
          return (aRisk - bRisk) * multiplier;
        });
      case "status":
        return sorted.sort((a, b) => (a.status || '').localeCompare(b.status || '') * multiplier);
      case "breed":
        return sorted.sort((a, b) => (a.breed || '').localeCompare(b.breed || '') * multiplier);
      default:
        return sorted;
    }
  };
  
  const sortedHorses = [...sortHorses(favoriteHorses), ...sortHorses(nonFavoriteHorses)];
  const favoriteIds = new Set(favoriteHorses.map(h => h.id));

  // Calculate statistics
  const activeHorses = horses?.filter(h => h.status === "active").length || 0;
  const trainingHorses = horses?.filter(h => h.status === "active").length || 0; // Simplified
  const retiredHorses = horses?.filter(h => h.status === "retired").length || 0;
  const injuredHorses = horses?.filter(h => h.status === "injured").length || 0;
  const totalHorses = horses?.length || 0;

  // 30-day statistics
  const newHorses30Days = stats?.newHorses30Days || 0;
  const recentChanges30Days = stats?.recentChanges30Days || 0;
  const sessions30Days = stats?.sessions30Days || 0;

  const handleToggleFavorite = (horseId: number, isFavorite: boolean) => {
    if (isFavorite) {
      removeFavorite.mutate({ horseId });
    } else {
      addFavorite.mutate({ horseId });
    }
  };

  const handleEditClick = (horse: any) => {
    setEditingHorseId(horse.id);
    const healthRecords = horse.healthRecords || {};
    setEditForm({
      name: horse.name,
      alias: horse.alias || "",
      breed: horse.breed || "",
      weight: healthRecords.weight?.toString() || "",
      owner: healthRecords.owner || "",
      rider: healthRecords.rider || "",
      birthPlace: healthRecords.birthPlace || "",
      location: healthRecords.location || "",
      color: healthRecords.color || "",
      gender: healthRecords.gender || "",
    });
  };

  const handleSaveEdit = () => {
    if (editingHorseId) {
      updateHorse.mutate({
        id: editingHorseId,
        name: editForm.name,
        alias: editForm.alias || undefined,
        breed: editForm.breed || undefined,
        healthRecords: {
          weight: editForm.weight ? parseInt(editForm.weight) : undefined,
          owner: editForm.owner || undefined,
          rider: editForm.rider || undefined,
          birthPlace: editForm.birthPlace || undefined,
          location: editForm.location || undefined,
          color: editForm.color || undefined,
          gender: editForm.gender || undefined,
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingHorseId(null);
  };

  const handleAddHorse = () => {
    if (newHorseForm.name.trim()) {
      createHorse.mutate({
        organizationId: selectedOrgId!,
        name: newHorseForm.name,
        alias: newHorseForm.alias || undefined,
        breed: newHorseForm.breed || undefined,
      });
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-green-900">Horse Registry for {selectedOrg?.name || 'Organization'}</h1>
          <p className="text-muted-foreground mt-1">
            Manage profiles for horses in {selectedOrg?.name || 'this organization'} ({totalHorses} total)
          </p>
        </div>
        <Button 
          onClick={() => setShowAddHorseDialog(true)}
          className="bg-orange-300 hover:bg-orange-400 text-gray-900"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Horse
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{activeHorses}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Horses</div>
              {statsLoading ? (
                <Skeleton className="h-2 w-10 mt-0.5 mx-auto" />
              ) : (
                <div className="text-xs text-green-600 mt-0.5">+{newHorses30Days} new (30d)</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{trainingHorses}</div>
              <div className="text-xs text-muted-foreground mt-1">Training Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{retiredHorses}</div>
              <div className="text-xs text-muted-foreground mt-1">Retired Horses</div>
            </div>
          </CardContent>
        </Card>
           <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{injuredHorses}</div>
              <div className="text-xs text-muted-foreground mt-1">Injured Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="py-2 px-3">
            <div className="text-center">
              <div className="text-2xl font-bold leading-none">{recentChanges30Days}</div>
              <div className="text-xs text-muted-foreground mt-1">Recent Changes</div>
              {statsLoading ? (
                <Skeleton className="h-2 w-10 mt-0.5 mx-auto" />
              ) : (
                <div className="text-xs text-blue-600 mt-0.5">{sessions30Days} sessions</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="searchHorses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latestSession">Latest Session ↓</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="breed">Breed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </Button>
      </div>

      {/* Table Header */}
      <div className="border rounded-lg p-4 bg-gray-50 font-medium text-sm text-muted-foreground overflow-x-auto">
        <div className="flex items-center min-w-max md:min-w-0">
          <div className="w-6 md:w-8 flex-shrink-0"></div>
          <button
            onClick={() => {
              if (sortBy === 'name') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('name');
                setSortOrder('asc');
              }
            }}
            className="flex-1 min-w-[120px] md:min-w-0 text-left hover:text-foreground transition-colors flex items-center gap-1"
          >
            Horse
            {sortBy === 'name' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => {
              if (sortBy === 'risk') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('risk');
                setSortOrder('asc');
              }
            }}
            className="w-16 md:w-24 text-left hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Risk
            {sortBy === 'risk' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => {
              if (sortBy === 'latestSession') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('latestSession');
                setSortOrder('desc');
              }
            }}
            className="w-20 md:w-32 text-left hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Date
            {sortBy === 'latestSession' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => {
              if (sortBy === 'duration') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('duration');
                setSortOrder('asc');
              }
            }}
            className="w-16 md:w-24 text-left hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Duration
            {sortBy === 'duration' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => {
              if (sortBy === 'track') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('track');
                setSortOrder('asc');
              }
            }}
            className="w-20 md:w-32 text-left hover:text-foreground transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Track
            {sortBy === 'track' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <div className="w-6 md:w-8 flex-shrink-0"></div>
        </div>
      </div>

      {/* Horses List */}
      <div className="space-y-0">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border-b">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </>
        ) : sortedHorses.length > 0 ? (
          sortedHorses.map((horse, index) => {
            const isFavorite = favoriteIds.has(horse.id);
            const isEditing = editingHorseId === horse.id;
            const latestSession = (horse as any).latestSession;

            if (isEditing) {
              return (
                <div key={horse.id} className="p-6 border-b bg-white">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name *</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Alias</Label>
                        <Input
                          value={editForm.alias}
                          onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Breed</Label>
                        <Input
                          value={editForm.breed}
                          onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                        <Input
                          type="number"
                          value={editForm.weight}
                          onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Owner</Label>
                        <Input
                          value={editForm.owner}
                          onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Rider</Label>
                        <Input
                          value={editForm.rider}
                          onChange={(e) => setEditForm({ ...editForm, rider: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Birth Place</Label>
                        <Input
                          value={editForm.birthPlace}
                          onChange={(e) => setEditForm({ ...editForm, birthPlace: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <Input
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Color</Label>
                        <Input
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Gender</Label>
                        <Input
                          value={editForm.gender}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancelEdit} className="h-9">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit} className="h-9 bg-green-600 hover:bg-green-700">
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={horse.id} className="border-b p-3 md:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  {/* Favorite Icon + Horse Name and Alias */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleFavorite(horse.id, isFavorite)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded flex-shrink-0"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          isFavorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setLocation(`/sessions?horseId=${horse.id}`)}
                        className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        <h3 className="font-semibold text-sm md:text-base hover:text-primary transition-colors truncate">
                          {horse.name}
                        </h3>
                      </button>
                      <p className="text-xs text-muted-foreground truncate">{(horse as any).alias || 'No alias'}</p>
                    </div>
                  </div>

                  {/* Injury Risk */}
                  <div className="w-16 md:w-24 flex-shrink-0">
                    {latestSession?.injuryRisk ? (
                      <Badge variant={getRiskColor(latestSession.injuryRisk) as any}>
                        {latestSession.injuryRisk}
                      </Badge>
                    ) : (
                      <Badge variant={getRiskColor(null) as any}>no-data</Badge>
                    )}
                  </div>

                  {/* Latest Session Date */}
                  <div className="w-20 md:w-32 text-xs md:text-sm text-left flex-shrink-0">
                    {latestSession ? (
                      <button
                        onClick={() => setLocation(`/sessions/${latestSession.id}?horseId=${horse.id}`)}
                        className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatDateTimeShort(latestSession.sessionDate)}
                        </span>
                      </button>
                    ) : (
                      <span className="text-muted-foreground">No sessions</span>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="w-16 md:w-24 text-xs md:text-sm text-left flex-shrink-0">
                    {latestSession?.performanceData && (latestSession.performanceData as any).duration ? (
                      <span>
                        {formatDuration((latestSession.performanceData as any).duration)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Track - hidden on mobile */}
                  <div className="hidden md:block w-32 text-sm text-left text-muted-foreground flex-shrink-0">
                    {(horse as any).trackName || '—'}
                  </div>

                  {/* Edit Button */}
                  <div className="w-6 md:w-8 flex justify-end flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(horse)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            No horses found. Try adjusting your search or filters.
          </div>
        )}
      </div>

      {/* Add Horse Dialog */}
      <Dialog open={showAddHorseDialog} onOpenChange={setShowAddHorseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Horse</DialogTitle>
            <DialogDescription>
              Create a new horse profile for {selectedOrg?.name || 'your organization'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="horse-name">Horse Name *</Label>
              <Input
                id="horse-name"
                value={newHorseForm.name}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, name: e.target.value })}
                placeholder="e.g., Golden Star"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-alias">Alias (Friendly Name)</Label>
              <Input
                id="horse-alias"
                value={newHorseForm.alias}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, alias: e.target.value })}
                placeholder="e.g., Goldie"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-breed">Breed</Label>
              <Input
                id="horse-breed"
                value={newHorseForm.breed}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, breed: e.target.value })}
                placeholder="e.g., Thoroughbred"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHorseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddHorse}
              disabled={!newHorseForm.name.trim() || createHorse.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createHorse.isPending ? 'Creating...' : 'Create Horse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

