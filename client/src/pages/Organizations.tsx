import { trpc } from "@/lib/trpc";
import { Building2, Mail, MapPin, Phone, Plus, Edit2, Save, X, Warehouse } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function Organizations() {
  const { user } = useAuth();
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const { data: organizations, isLoading } = trpc.organizations.list.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.organizations.update.useMutation({
    onSuccess: () => {
      toast.success("Organization updated successfully");
      utils.organizations.list.invalidate();
      setEditingOrgId(null);
    },
    onError: (error) => {
      toast.error(`Failed to update organization: ${error.message}`);
    },
  });

  const handleEdit = (org: any) => {
    setEditingOrgId(org.id);
    setEditForm({
      name: org.name,
      phone: org.contactInfo?.phone || "",
      email: org.contactInfo?.email || "",
      address: org.contactInfo?.address || "",
    });
  };

  const handleSave = () => {
    if (!editingOrgId) return;

    updateMutation.mutate({
      id: editingOrgId,
      name: editForm.name,
      contactInfo: {
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
      },
    });
  };

  const handleCancel = () => {
    setEditingOrgId(null);
  };

  const canEdit = (org: any) => {
    // Admins can edit all organizations
    if (user?.role === "admin") return true;
    // Owners can edit their own organization
    if (org.ownerId === user?.id) return true;
    return false;
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      <div className="flex items-center justify-between">
        <div className="page-header flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage Profiles
          </p>
        </div>
        {user?.role === "admin" && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        )}
      </div>

      {/* Organizations List */}
      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : organizations && organizations.length > 0 ? (
          organizations.map((org) => {
            const isEditing = editingOrgId === org.id;
            const canEditOrg = canEdit(org);

            return (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="text-lg font-semibold"
                        />
                      ) : (
                        <div>
                          <CardTitle className="text-xl">{org.name}</CardTitle>
                          {org.ownerId === user?.id && (
                            <Badge variant="secondary" className="mt-1">
                              Owner
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {canEditOrg && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(org)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          placeholder="Email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={editForm.address}
                          onChange={(e) =>
                            setEditForm({ ...editForm, address: e.target.value })
                          }
                          placeholder="Physical address"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {org.contactInfo?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{org.contactInfo.phone}</span>
                        </div>
                      )}
                      {org.contactInfo?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{org.contactInfo.email}</span>
                        </div>
                      )}
                      {org.contactInfo?.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{org.contactInfo.address}</span>
                        </div>
                      )}
                      {!org.contactInfo?.phone &&
                        !org.contactInfo?.email &&
                        !org.contactInfo?.address && (
                          <p className="text-sm text-muted-foreground italic">
                            No contact information available
                          </p>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No organizations found</p>
                <p className="text-sm mt-1">
                  Organizations will appear here once created
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

