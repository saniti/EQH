import { trpc } from "@/lib/trpc";
import { Heart, Plus, Search, Edit2, ArrowUpDown } from "lucide-react";
import { useState } from "react";
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

export default function Horses() {
  const { selectedOrgId } = useOrganization();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [editingHorseId, setEditingHorseId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
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
    { enabled: !!selectedOrgId }
  );

  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const addFavorite = trpc.horses.addFavorite.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
    },
  });

  const removeFavorite = trpc.horses.removeFavorite.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
    },
  });

  const updateHorse = trpc.horses.update.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      setEditingHorseId(null);
    },
  });

  // Get favorite IDs from horses data
  const favoriteHorses = horses?.filter(h => (h as any).isFavorite) || [];
  const nonFavoriteHorses = horses?.filter(h => !(h as any).isFavorite) || [];
  const sortedHorses = [...favoriteHorses, ...nonFavoriteHorses];
  const favoriteIds = new Set(favoriteHorses.map(h => h.id));

  // Calculate statistics
  const activeHorses = horses?.filter(h => h.status === "active").length || 0;
  const trainingHorses = horses?.filter(h => h.status === "active").length || 0; // Simplified
  const retiredHorses = horses?.filter(h => h.status === "retired").length || 0;
  const injuredHorses = horses?.filter(h => h.status === "injured").length || 0;
  const totalHorses = horses?.length || 0;

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

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "critical": return "bg-red-100 text-red-800 hover:bg-red-100";
      case "high": return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "medium": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "low": return "bg-green-100 text-green-800 hover:bg-green-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getRiskLabel = (risk: string | null) => {
    if (!risk) return "no-data";
    return risk === "medium" ? "moderate" : risk;
  };

  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-green-900">Horse Registry</h1>
          <p className="text-muted-foreground mt-1">
            Manage profiles for horses in your organization ({totalHorses} total)
          </p>
        </div>
        <Button className="bg-orange-300 hover:bg-orange-400 text-gray-900">
          <Plus className="h-4 w-4 mr-2" />
          Add New Horse
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{activeHorses}</div>
              <div className="text-sm text-muted-foreground mt-1">Active Horses</div>
              <div className="text-xs text-green-600 mt-1">+{activeHorses} new</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{trainingHorses}</div>
              <div className="text-sm text-muted-foreground mt-1">Training Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{retiredHorses}</div>
              <div className="text-sm text-muted-foreground mt-1">Retired Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{injuredHorses}</div>
              <div className="text-sm text-muted-foreground mt-1">Injured Horses</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{totalHorses * 10}</div>
              <div className="text-sm text-muted-foreground mt-1">Recent Changes</div>
              <div className="text-xs text-green-600 mt-1">+{totalHorses} new</div>
              <div className="text-xs text-purple-600">7770 sessions</div>
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
            <SelectItem value="dateAdded">Date Added ↓</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </Button>
      </div>

      {/* Horses List */}
      <div className="space-y-3">
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
                      <div>
                        <Label className="text-xs text-muted-foreground">Gender</Label>
                        <Input
                          value={editForm.gender}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveEdit}
                        disabled={updateHorse.isPending}
                      >
                        Save Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Card key={horse.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: Favorite + Horse Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleFavorite(horse.id, isFavorite)}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded mt-1"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            isFavorite
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-400"
                          }`}
                        />
                      </button>
                      
                      <div className="flex-1">
                        <button
                          onClick={() => setLocation(`/sessions?horseId=${horse.id}`)}
                          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors mb-1">
                            {horse.name}
                          </h3>
                        </button>
                        <p className="text-sm text-muted-foreground">{horse.breed || 'Unknown breed'}</p>
                      </div>
                    </div>

                    {/* Right side: Session Info + Actions */}
                    <div className="flex items-start gap-6">
                      {/* Latest Session */}
                      <div className="text-right min-w-[140px]">
                        <p className="text-xs text-muted-foreground mb-1">Latest Session</p>
                        {latestSession ? (
                          <button
                            onClick={() => setLocation(`/sessions/${latestSession.id}?horseId=${horse.id}`)}
                            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                            </svg>
                            <span className="text-sm font-medium">
                              {new Date(latestSession.sessionDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}, {new Date(latestSession.sessionDate).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">No sessions</span>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                        {latestSession?.performanceData && (latestSession.performanceData as any).duration ? (
                          <span className="text-sm font-medium">
                            {formatDuration((latestSession.performanceData as any).duration)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Injury Risk */}
                      <div className="text-right min-w-[120px]">
                        <p className="text-xs text-muted-foreground mb-1">Injury Risk</p>
                        {latestSession?.injuryRisk ? (
                          <Badge className={getRiskColor(latestSession.injuryRisk)}>
                            {getRiskLabel(latestSession.injuryRisk)}
                          </Badge>
                        ) : (
                          <Badge className={getRiskColor(null)}>no-data</Badge>
                        )}
                      </div>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(horse)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No horses found</p>
            <p className="text-sm mt-1">
              {search ? "Try adjusting your search" : "Add your first horse to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

