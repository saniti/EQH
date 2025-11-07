import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users as UsersIcon, Shield, Stethoscope, Building2, Pencil, Trash2 } from "lucide-react";
import { formatDateShort } from "@/lib/dateFormat";

export function Users() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [editUserType, setEditUserType] = useState<"standard" | "veterinarian">("standard");
  const [editStatus, setEditStatus] = useState<"active" | "suspended" | "deactivated">("active");

  const utils = trpc.useUtils();
  const usersQuery = trpc.users.list.useQuery();
  const organizationsQuery = trpc.organizations.list.useQuery();
  
  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
  });

  const userOrgsQuery = trpc.users.getOrganizations.useQuery(
    { userId: selectedUser! },
    { enabled: !!selectedUser && orgDialogOpen }
  );

  const addToOrgMutation = trpc.users.addToOrganization.useMutation({
    onSuccess: () => {
      userOrgsQuery.refetch();
    },
  });

  const removeFromOrgMutation = trpc.users.removeFromOrganization.useMutation({
    onSuccess: () => {
      userOrgsQuery.refetch();
    },
  });

  const users = usersQuery.data || [];
  const organizations = organizationsQuery.data || [];
  const userOrganizations = userOrgsQuery.data || [];

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setSelectedUser(userId);
    setEditRole(user.role);
    setEditUserType(user.userType);
    setEditStatus(user.status);
    setEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    updateUserMutation.mutate({
      id: selectedUser,
      role: editRole,
      userType: editUserType,
      status: editStatus,
    });
  };

  const handleManageOrganizations = (userId: string) => {
    setSelectedUser(userId);
    setOrgDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    setSelectedUser(userId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate({ id: selectedUser });
  };

  const handleToggleOrganization = (orgId: number, isAssigned: boolean) => {
    if (!selectedUser) return;

    if (isAssigned) {
      removeFromOrgMutation.mutate({
        userId: selectedUser,
        organizationId: orgId,
      });
    } else {
      addToOrgMutation.mutate({
        userId: selectedUser,
        organizationId: orgId,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="default" className="gap-1">
        <Shield className="h-3 w-3" />
        Administrator
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <UsersIcon className="h-3 w-3" />
        User
      </Badge>
    );
  };

  const getUserTypeBadge = (userType: string) => {
    return userType === "veterinarian" ? (
      <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
        <Stethoscope className="h-3 w-3" />
        Veterinarian
      </Badge>
    ) : (
      <Badge variant="outline">Standard</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Active" },
      suspended: { variant: "secondary", label: "Suspended" },
      deactivated: { variant: "destructive", label: "Deactivated" },
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const selectedUserData = users.find((u) => u.id === selectedUser);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts, roles, and organization assignments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {users.length} {users.length === 1 ? "User" : "Users"}
            </Badge>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="whitespace-nowrap">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Last Sign In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Organizations</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const userOrgCount = userOrganizations.length;
                return (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{user.name || "Unnamed User"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            ID: {user.id}
                          </div>
                        </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-3">{getUserTypeBadge(user.userType)}</td>
                    <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.lastSignedIn ? formatDateShort(new Date(user.lastSignedIn)) : "Never"}
                      </td>
                    <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageOrganizations(user.id)}
                          className="gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          Manage Organizations
                        </Button>
                      </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No users found
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role, type, and status for {selectedUserData?.name || "this user"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as "user" | "admin")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Administrators have full system access
              </p>
            </div>

            <div className="space-y-2">
              <Label>User Type</Label>
              <Select
                value={editUserType}
                onValueChange={(v) => setEditUserType(v as "standard" | "veterinarian")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Veterinarians have access to medical records and injury tracking
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editStatus}
                onValueChange={(v) =>
                  setEditStatus(v as "active" | "suspended" | "deactivated")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Organizations Dialog */}
      <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Organizations</DialogTitle>
            <DialogDescription>
              Assign {selectedUserData?.name || "this user"} to organizations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {organizations.map((org) => {
              const isAssigned = userOrganizations.some((userOrg) => userOrg.id === org.id);
              return (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isAssigned}
                      onCheckedChange={() => handleToggleOrganization(org.id, isAssigned)}
                      disabled={
                        addToOrgMutation.isPending || removeFromOrgMutation.isPending
                      }
                    />
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {org.id}</div>
                    </div>
                  </div>
                  {isAssigned && (
                    <Badge variant="secondary">Assigned</Badge>
                  )}
                </div>
              );
            })}
          </div>

          {organizations.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No organizations available
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOrgDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUserData?.name || "this user"}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

