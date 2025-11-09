import { trpc } from "@/lib/trpc";
import { formatDateTimeShort } from "@/lib/dateFormat";
import { Heart, Plus, Search, Edit2, ArrowUpDown, Clock, Activity, TrendingUp, Users, AlertTriangle, Calendar, Eye, X, Upload } from "lucide-react";
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
  const [viewingHorseId, setViewingHorseId] = useState<number | null>(null);
  const [showAddHorseDialog, setShowAddHorseDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [newHorseForm, setNewHorseForm] = useState({
    name: '',
    alias: '',
    breed: '',
    weight: '',
    owner: '',
    rider: '',
    birthPlace: '',
    location: '',
    color: '',
    gender: '',
    pictureData: '',
  });
  const [picturePreview, setPicturePreview] = useState<string>('');
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
    pictureData: "",
  });
  const [viewingHorse, setViewingHorse] = useState<any>(null);

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

  // Clear filters when Horses page mounts
  useEffect(() => {
    setSearch("");
    setSortBy("latestSession");
  }, []);

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
      setNewHorseForm({ name: '', alias: '', breed: '', weight: '', owner: '', rider: '', birthPlace: '', location: '', color: '', gender: '', pictureData: '' });
      setEditingHorseId(null);
      setPicturePreview('');
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
      case "track":
        return sorted.sort((a, b) => {
          const aTrack = a.latestSession?.trackName || a.trackName || '';
          const bTrack = b.latestSession?.trackName || b.trackName || '';
          return aTrack.localeCompare(bTrack) * multiplier;
        });
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
      pictureData: horse.pictureData || "",
    });
    setPicturePreview(horse.pictureData || '');
  };

  const handleViewClick = (horse: any) => {
    setViewingHorse(horse);
    setShowViewDialog(true);
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG image');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPicturePreview(dataUrl);

      try {
        const base64Data = dataUrl.split(',')[1];
        const result = await trpc.horses.uploadPicture.mutate({
          fileName: file.name,
          fileData: base64Data,
          contentType: file.type,
        });

        if (result.success && result.url) {
          if (formType === 'add') {
            setNewHorseForm({ ...newHorseForm, pictureUrl: result.url });
          } else {
            setEditForm({ ...editForm, pictureUrl: result.url });
          }
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setPicturePreview('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    if (editingHorseId) {
      updateHorse.mutate({
        id: editingHorseId,
        name: editForm.name,
        alias: editForm.alias || undefined,
        breed: editForm.breed || undefined,
        pictureData: editForm.pictureData || undefined,
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
      setPicturePreview('');
    }
  };

  const handleCancelEdit = () => {
    setEditingHorseId(null);
    setPicturePreview('');
  };

  const handleAddHorse = () => {
    if (newHorseForm.name.trim()) {
      createHorse.mutate({
        organizationId: selectedOrgId!,
        name: newHorseForm.name,
        alias: newHorseForm.alias || undefined,
        breed: newHorseForm.breed || undefined,
        pictureData: newHorseForm.pictureData || undefined,
        healthRecords: {
          weight: newHorseForm.weight ? parseInt(newHorseForm.weight) : undefined,
          owner: newHorseForm.owner || undefined,
          rider: newHorseForm.rider || undefined,
          birthPlace: newHorseForm.birthPlace || undefined,
          location: newHorseForm.location || undefined,
          color: newHorseForm.color || undefined,
          gender: newHorseForm.gender || undefined,
        },
      });
      setPicturePreview('');
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
    <div className="p-6 space-y-6 bg-background">
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="text-3xl font-bold tracking-tight">Horses</h1>
          <p className="text-muted-foreground mt-1">
            {selectedOrg?.name || 'Organization'}
          </p>
        </div>
        <Button 
          onClick={() => setShowAddHorseDialog(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Horse
        </Button>
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
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => {
            setSearch("");
            setSortBy("latestSession");
            setSortOrder("desc");
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </Button>
      </div>

      {/* Table - Desktop View */}
      <div className="border rounded-lg overflow-x-auto hidden md:block">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground w-8"></th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                <button
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Horse
                  {sortBy === 'name' && (
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
                    if (sortBy === 'latestSession') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('latestSession');
                      setSortOrder('desc');
                    }
                  }}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Latest Session
                  {sortBy === 'latestSession' && (
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
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>

      {/* Horses List */}
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
      ) : sortedHorses.length > 0 ? (
        sortedHorses.map((horse, index) => {
          const isFavorite = favoriteIds.has(horse.id);
          const isEditing = editingHorseId === horse.id;
          const latestSession = (horse as any).latestSession;

          if (isEditing) {
            return (
              <tr key={horse.id}>
                <td colSpan={7} className="p-6 border-b bg-card">
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Picture (PNG, JPG, SVG)</Label>
                      <div className="relative">
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={(e) => handlePictureUpload(e, 'edit')}
                        className="h-9 mt-1"
                      />
                      </div>
                      {picturePreview && (
                        <div className="mt-2 w-32 h-32 bg-muted rounded-lg overflow-hidden relative">
                          <img
                            src={picturePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => {
                              setEditForm({ ...editForm, pictureData: '' });
                              setPicturePreview('');
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
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
                </td>
              </tr>
            );
          }

          return (
            <tr key={horse.id} className={`border-b hover:bg-muted/50 transition-colors ${
              index % 2 === 0 ? 'even-row' : 'odd-row'
            }`}>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleToggleFavorite(horse.id, isFavorite)}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isFavorite
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground hover:text-amber-400"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => setLocation(`/sessions?horseId=${horse.id}`)}
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                    {horse.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{(horse as any).alias || 'No alias'}</p>
                </button>
              </td>
              <td className="px-4 py-3">
                {latestSession?.injuryRisk ? (
                  <Badge variant={getRiskColor(latestSession.injuryRisk) as any}>
                    {latestSession.injuryRisk}
                  </Badge>
                ) : (
                  <Badge variant={getRiskColor(null) as any}>no-data</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {latestSession ? (
                  <button
                    onClick={() => setLocation(`/sessions/${latestSession.id}?horseId=${horse.id}`)}
                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <div>{formatDateTimeShort(latestSession.sessionDate)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(latestSession.sessionDate).toLocaleTimeString()}
                        {latestSession?.performanceData && (latestSession.performanceData as any).duration && (
                          <span> ({formatDuration((latestSession.performanceData as any).duration)})</span>
                        )}
                      </div>
                    </div>
                  </button>
                ) : (
                  <span className="text-muted-foreground">No sessions</span>
                )}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                {latestSession?.trackName || (horse as any).trackName || '—'}
              </td>
              <td className="px-4 py-3 text-right flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewClick(horse)}
                  className="h-7 w-7 p-0"
                  title="View details"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditClick(horse)}
                  className="h-7 w-7 p-0"
                  title="Edit horse"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={7} className="p-12 text-center text-muted-foreground">
            No horses found. Try adjusting your search or filters.
          </td>
        </tr>
      )}
          </tbody>
        </table>
      </div>

      {/* Cards - Mobile View */}
      <div className="md:hidden space-y-4">
        {sortedHorses.map((horse) => {
          const isFavorite = favoriteIds.has(horse.id);
          const latestSession = (horse as any).latestSession;

          return (
            <div key={horse.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
              <div className="space-y-3">
                {/* Header with favorite and edit buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <button
                      onClick={() => setLocation(`/sessions?horseId=${horse.id}`)}
                      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <h3 className="font-semibold text-sm hover:text-primary transition-colors">
                        {horse.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{(horse as any).alias || 'No alias'}</p>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFavorite(horse.id, isFavorite)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          isFavorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground hover:text-amber-400"
                        }`}
                      />
                    </button>
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

                {/* Risk Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Risk:</span>
                  {latestSession?.injuryRisk ? (
                    <Badge variant={getRiskColor(latestSession.injuryRisk) as any}>
                      {latestSession.injuryRisk}
                    </Badge>
                  ) : (
                    <Badge variant={getRiskColor(null) as any}>no-data</Badge>
                  )}
                </div>

                {/* Latest Session */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Latest Session:</span>
                  {latestSession ? (
                    <button
                      onClick={() => setLocation(`/sessions/${latestSession.id}?horseId=${horse.id}`)}
                      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded hover:text-primary transition-colors block text-sm"
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <div>
                          <div>{formatDateTimeShort(latestSession.sessionDate)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(latestSession.sessionDate).toLocaleTimeString()}
                            {latestSession?.performanceData && (latestSession.performanceData as any).duration && (
                              <span> ({formatDuration((latestSession.performanceData as any).duration)})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-sm">No sessions</span>
                  )}
                </div>

                {/* Track */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Track:</span>
                  <span className="text-sm">{latestSession?.trackName || (horse as any).trackName || '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
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
            <div>
              <Label htmlFor="horse-weight">Weight (kg)</Label>
              <Input
                id="horse-weight"
                type="number"
                value={newHorseForm.weight}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, weight: e.target.value })}
                placeholder="e.g., 500"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-owner">Owner</Label>
              <Input
                id="horse-owner"
                value={newHorseForm.owner}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, owner: e.target.value })}
                placeholder="e.g., John Smith"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-rider">Rider</Label>
              <Input
                id="horse-rider"
                value={newHorseForm.rider}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, rider: e.target.value })}
                placeholder="e.g., Jane Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-birthplace">Birth Place</Label>
              <Input
                id="horse-birthplace"
                value={newHorseForm.birthPlace}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, birthPlace: e.target.value })}
                placeholder="e.g., Kentucky, USA"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-location">Location</Label>
              <Input
                id="horse-location"
                value={newHorseForm.location}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, location: e.target.value })}
                placeholder="e.g., Stable A"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-color">Color</Label>
              <Input
                id="horse-color"
                value={newHorseForm.color}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, color: e.target.value })}
                placeholder="e.g., Bay"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-gender">Gender</Label>
              <Input
                id="horse-gender"
                value={newHorseForm.gender}
                onChange={(e) => setNewHorseForm({ ...newHorseForm, gender: e.target.value })}
                placeholder="e.g., Mare"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="horse-picture">Picture (PNG, JPG, SVG)</Label>
              <Input
                id="horse-picture"
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={(e) => handlePictureUpload(e, 'add')}
                className="mt-1"
              />
              {picturePreview && (
                <div className="mt-2 w-32 h-32 bg-muted rounded-lg overflow-hidden relative">
                  <img
                    src={picturePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                       setNewHorseForm({ ...newHorseForm, pictureData: '' });
                      setPicturePreview('');
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
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

      {/* View Horse Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingHorse?.name}</DialogTitle>
            <DialogDescription>
              {viewingHorse?.alias && `${viewingHorse.alias} • `}
              {viewingHorse?.breed || 'No breed information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewingHorse?.pictureData && (
              <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                <img
                  src={viewingHorse.pictureData}
                  alt={viewingHorse.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!viewingHorse?.pictureData && (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">No picture available</span>
              </div>
            )}
            {viewingHorse?.healthRecords && (
              <div className="space-y-2 text-sm">
                {viewingHorse.healthRecords.owner && (
                  <div><span className="font-medium">Owner:</span> {viewingHorse.healthRecords.owner}</div>
                )}
                {viewingHorse.healthRecords.rider && (
                  <div><span className="font-medium">Rider:</span> {viewingHorse.healthRecords.rider}</div>
                )}
                {viewingHorse.healthRecords.weight && (
                  <div><span className="font-medium">Weight:</span> {viewingHorse.healthRecords.weight} kg</div>
                )}
                {viewingHorse.healthRecords.color && (
                  <div><span className="font-medium">Color:</span> {viewingHorse.healthRecords.color}</div>
                )}
                {viewingHorse.healthRecords.gender && (
                  <div><span className="font-medium">Gender:</span> {viewingHorse.healthRecords.gender}</div>
                )}
                {viewingHorse.healthRecords.birthPlace && (
                  <div><span className="font-medium">Birth Place:</span> {viewingHorse.healthRecords.birthPlace}</div>
                )}
                {viewingHorse.healthRecords.location && (
                  <div><span className="font-medium">Location:</span> {viewingHorse.healthRecords.location}</div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

