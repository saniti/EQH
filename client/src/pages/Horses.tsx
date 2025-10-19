import { trpc } from "@/lib/trpc";
import { Heart, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";

export default function Horses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [breedFilter, setBreedFilter] = useState<string>("");

  const { data: horses, isLoading } = trpc.horses.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    breed: breedFilter || undefined,
    limit: 50,
    offset: 0,
  });

  const utils = trpc.useUtils();

  const addFavorite = trpc.horses.addFavorite.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      utils.dashboard.getFavoriteHorses.invalidate();
    },
  });

  const removeFavorite = trpc.horses.removeFavorite.useMutation({
    onSuccess: () => {
      utils.horses.list.invalidate();
      utils.dashboard.getFavoriteHorses.invalidate();
    },
  });

  const handleToggleFavorite = (horseId: number, isFavorite: boolean) => {
    if (isFavorite) {
      removeFavorite.mutate({ horseId });
    } else {
      addFavorite.mutate({ horseId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horses</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your horse registry
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Horse
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search horses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="injured">Injured</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by breed..."
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Horse List */}
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
        ) : horses && horses.length > 0 ? (
          horses.map((horse) => (
            <Card key={horse.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link href={`/horses/${horse.id}`}>
                      <a className="text-lg font-semibold hover:underline">
                        {horse.name}
                      </a>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {horse.breed || "Unknown breed"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(horse.id, false)}
                    className="ml-2"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
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
                  {horse.deviceId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Device</span>
                      <span className="text-sm font-medium">
                        Device #{horse.deviceId}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No horses found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter || breedFilter
                  ? "Try adjusting your filters"
                  : "Get started by adding your first horse"}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Horse
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

