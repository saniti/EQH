import { trpc } from "@/lib/trpc";
import { Heart, Plus, Search, Edit2, X, Check, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function Horses() {
  const { selectedOrgId } = useOrganization();
  const [search, setSearch] = useState("");
  const [editingHorseId, setEditingHorseId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
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

  // Get favorite IDs from horses data (assuming isFavorite field exists)
  const favoriteHorses = horses?.filter(h => (h as any).isFavorite) || [];
  const nonFavoriteHorses = horses?.filter(h => !(h as any).isFavorite) || [];
  const sortedHorses = [...favoriteHorses, ...nonFavoriteHorses];
  const favoriteIds = new Set(favoriteHorses.map(h => h.id));

  const handleToggleFavorite = (horseId: number, isFavorite: boolean) => {
    if (isFavorite) {
      removeFavorite.mutate({ horseId });
    } else {
      addFavorite.mutate({ horseId });
    }
  };

  const handleEditClick = (horse: any) => {
    setEditingHorseId(horse.id);
    setEditForm({
      name: horse.name,
      breed: horse.breed || "",
      age: horse.age?.toString() || "",
      weight: horse.weight?.toString() || "",
    });
  };

  const handleSaveEdit = () => {
    if (editingHorseId) {
      updateHorse.mutate({
        id: editingHorseId,
        name: editForm.name,
        breed: editForm.breed || undefined,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingHorseId(null);
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
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horses</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your horses
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Horse
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search horses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Horses List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : sortedHorses.length > 0 ? (
          sortedHorses.map((horse) => {
            const isFavorite = favoriteIds.has(horse.id);
            const isEditing = editingHorseId === horse.id;
            const latestSession = (horse as any).latestSession;

            return (
              <Card key={horse.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="grid grid-cols-[1fr,auto] gap-4 items-center">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Name</Label>
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
                          <Label className="text-xs text-muted-foreground">Age</Label>
                          <Input
                            type="number"
                            value={editForm.age}
                            onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
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
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleSaveEdit}
                          disabled={updateHorse.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] gap-6 items-center">
                      {/* Favorite Icon */}
                      <button
                        onClick={() => handleToggleFavorite(horse.id, isFavorite)}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            isFavorite
                              ? "fill-red-500 text-red-500"
                              : "text-muted-foreground hover:text-red-500"
                          }`}
                        />
                      </button>

                      {/* Horse Name */}
                      <div>
                        <button
                          onClick={() => setLocation(`/sessions?horseId=${horse.id}`)}
                          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                            {horse.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {horse.breed || "Unknown breed"}
                          </p>
                        </button>
                      </div>

                      {/* Latest Session */}
                      <div className="min-w-[180px]">
                        {latestSession ? (
                          <button
                            onClick={() => setLocation(`/sessions/${latestSession.id}`)}
                            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded hover:bg-accent/50 p-2 -m-2 transition-colors"
                          >
                            <p className="text-sm font-medium">
                              {new Date(latestSession.sessionDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(latestSession.sessionDate).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </button>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No sessions yet
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="min-w-[100px]">
                        {latestSession?.performanceData && (latestSession.performanceData as any).duration ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatDuration((latestSession.performanceData as any).duration)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Injury Risk */}
                      <div className="min-w-[120px]">
                        {latestSession?.injuryRisk ? (
                          <Badge variant={getRiskColor(latestSession.injuryRisk)}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {latestSession.injuryRisk}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No risk data</Badge>
                        )}
                      </div>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(horse)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No horses found</p>
                <p className="text-sm mt-1">
                  {search ? "Try adjusting your search" : "Add your first horse to get started"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

