import { trpc } from "@/lib/trpc";
import { formatDateShort } from "@/lib/dateFormat";
import { AlertTriangle, Edit2, Trash2, Plus, X, BriefcaseMedical, Gauge } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useMeasurement } from "@/contexts/MeasurementContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function InjuryRecords() {
  const { selectedOrgId, selectedOrg } = useOrganization();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInjury, setEditingInjury] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    sessionId: "",
    affectedParts: "",
    notes: "",
    status: "flagged" as "flagged" | "dismissed" | "diagnosed",
    medicalDiagnosis: "",
  });

  const { data: injuries, isLoading } = trpc.injuries.list.useQuery({
    organizationId: selectedOrgId!,
  });

  const { data: sessions } = trpc.sessions.list.useQuery({
    organizationId: selectedOrgId!,
  });

  const createInjury = trpc.injuries.create.useMutation({
    onSuccess: () => {
      toast.success("Injury record created successfully");
      setShowCreateDialog(false);
      resetForm();
      trpc.useContext().injuries.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create injury record");
    },
  });

  const updateInjury = trpc.injuries.update.useMutation({
    onSuccess: () => {
      toast.success("Injury record updated successfully");
      setShowEditDialog(false);
      setEditingInjury(null);
      trpc.useContext().injuries.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update injury record");
    },
  });

  const deleteInjury = trpc.injuries.delete.useMutation({
    onSuccess: () => {
      toast.success("Injury record deleted successfully");
      trpc.useContext().injuries.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete injury record");
    },
  });

  const resetForm = () => {
    setFormData({
      sessionId: "",
      affectedParts: "",
      notes: "",
      status: "flagged",
      medicalDiagnosis: "",
    });
  };

  const handleCreateSubmit = () => {
    if (!formData.sessionId || !formData.affectedParts) {
      toast.error("Please fill in all required fields");
      return;
    }

    const affectedPartsArray = formData.affectedParts
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    createInjury.mutate({
      sessionId: parseInt(formData.sessionId),
      affectedParts: affectedPartsArray,
      notes: formData.notes || undefined,
    });
  };

  const handleEditClick = (injury: any) => {
    setEditingInjury(injury);
    setFormData({
      sessionId: injury.sessionId.toString(),
      affectedParts: injury.affectedParts.join(", "),
      notes: injury.notes || "",
      status: injury.status,
      medicalDiagnosis: injury.medicalDiagnosis || "",
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = () => {
    if (!editingInjury) return;

    updateInjury.mutate({
      id: editingInjury.id,
      status: formData.status,
      medicalDiagnosis: formData.medicalDiagnosis || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (id: number, horseName: string) => {
    if (confirm(`Are you sure you want to delete this injury record for ${horseName}?`)) {
      deleteInjury.mutate({ id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "flagged": return "destructive";
      case "dismissed": return "secondary";
      case "diagnosed": return "default";
      default: return "secondary";
    }
  };

  // Filter injuries
  const filteredInjuries = injuries?.filter(injury => {
    const matchesSearch = search === "" || 
      injury.horse?.name.toLowerCase().includes(search.toLowerCase()) ||
      injury.affectedParts.some(part => part.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || injury.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const isVet = user?.userType === "veterinarian";

  return (
    <div className="p-6 space-y-6 bg-background">
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="text-3xl font-bold tracking-tight">Injuries</h1>
          <p className="text-muted-foreground mt-1">
            {selectedOrg?.name || 'Organization'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MeasurementToggle />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Injury Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Search by horse name or affected parts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="diagnosed">Diagnosed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Injury Records List */}
      <div className="space-y-3">
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
        ) : filteredInjuries.length > 0 ? (
          filteredInjuries.map((injury) => (
            <Card key={injury.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-base font-semibold">
                          {injury.horse?.name || "Unknown Horse"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Session on {injury.session?.sessionDate ? formatDateShort(new Date(injury.session.sessionDate)) : "Unknown date"}
                        </p>
                      </div>
                    </div>

                    {/* Affected Parts */}
                    <div>
                      <p className="text-xs font-medium mb-1">Affected Parts:</p>
                      <div className="flex flex-wrap gap-2">
                        {injury.affectedParts.map((part, idx) => (
                          <Badge key={idx} variant="outline">{part}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {injury.notes && (
                      <div>
                        <p className="text-xs font-medium mb-1">Notes:</p>
                        <p className="text-xs text-muted-foreground">{injury.notes}</p>
                      </div>
                    )}

                    {/* Medical Diagnosis */}
                    {injury.medicalDiagnosis && (
                      <div>
                        <p className="text-xs font-medium mb-1">Medical Diagnosis:</p>
                        <p className="text-xs text-muted-foreground">{injury.medicalDiagnosis}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {injury.createdAt ? formatDateShort(new Date(injury.createdAt)) : "Unknown"}</span>
                      {injury.veterinarianId && (
                        <span>Reviewed by veterinarian</span>
                      )}
                      {injury.notificationSent && (
                        <span>Notification sent</span>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 md:mt-0">
                    <Badge variant={getStatusColor(injury.status) as any} className="whitespace-nowrap">
                      {injury.status}
                    </Badge>
                    
                    <div className="flex items-center gap-1 md:ml-auto">
                      {isVet && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEditClick(injury)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(injury.id, injury.horse?.name || "Unknown")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No injury records found</p>
                <p className="text-sm mt-1">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first injury record to get started"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Injury Record</DialogTitle>
            <DialogDescription>
              Record a new injury for a horse session
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="session">Session *</Label>
              <Select
                value={formData.sessionId}
                onValueChange={(value) => setFormData({ ...formData, sessionId: value })}
              >
                <SelectTrigger id="session">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session: any) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.horse?.name || "Unknown"} - {formatDateShort(new Date(session.sessionDate))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="affectedParts">Affected Parts * (comma-separated)</Label>
              <Input
                id="affectedParts"
                placeholder="e.g., Left Front Leg, Right Hind Leg"
                value={formData.affectedParts}
                onChange={(e) => setFormData({ ...formData, affectedParts: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the injury..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createInjury.isPending}>
              {createInjury.isPending ? "Creating..." : "Create Injury Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (Vet Only) */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Injury Record</DialogTitle>
            <DialogDescription>
              Update the status and diagnosis for this injury
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Horse</Label>
              <Input
                value={editingInjury?.horse?.name || "Unknown"}
                disabled
              />
            </div>

            <div>
              <Label>Affected Parts</Label>
              <Input
                value={formData.affectedParts}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="diagnosed">Diagnosed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-diagnosis">Medical Diagnosis</Label>
              <Textarea
                id="edit-diagnosis"
                placeholder="Enter medical diagnosis..."
                value={formData.medicalDiagnosis}
                onChange={(e) => setFormData({ ...formData, medicalDiagnosis: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingInjury(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateInjury.isPending}>
              {updateInjury.isPending ? "Updating..." : "Update Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeasurementToggle() {
  const { isMetric, setIsMetric } = useMeasurement();
  
  return (
    <button
      onClick={() => setIsMetric(!isMetric)}
      className="h-10 px-4 flex items-center gap-2 rounded-lg hover:bg-accent/50 transition-colors text-sm font-medium border border-input"
      title={isMetric ? "Switch to Imperial" : "Switch to Metric"}
    >
      <Gauge className="h-4 w-4" />
      <span>{isMetric ? "Metric" : "Imperial"}</span>
    </button>
  );
}

