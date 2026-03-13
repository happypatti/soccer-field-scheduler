"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Crown, Medal, Award, Users, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string;
  email: string;
  teamName: string | null;
  phone: string | null;
  role: string;
  tier: string;
  createdAt: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  gold: <Crown className="h-4 w-4 text-yellow-500" />,
  silver: <Medal className="h-4 w-4 text-gray-400" />,
  bronze: <Award className="h-4 w-4 text-amber-600" />,
};

const tierColors: Record<string, string> = {
  gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  silver: "bg-gray-100 text-gray-800 border-gray-300",
  bronze: "bg-amber-100 text-amber-800 border-amber-300",
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: UserItem | null }>({
    open: false,
    user: null,
  });
  const [selectedTier, setSelectedTier] = useState("bronze");
  const [selectedRole, setSelectedRole] = useState("user");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      toast.error("Access denied. Admin only.");
      router.push("/");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: UserItem) => {
    setEditDialog({ open: true, user });
    setSelectedTier(user.tier);
    setSelectedRole(user.role);
  };

  const saveUser = async () => {
    if (!editDialog.user) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${editDialog.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      toast.success("User updated successfully!");
      setEditDialog({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const goldUsers = users.filter(u => u.tier === "gold").length;
  const silverUsers = users.filter(u => u.tier === "silver").length;
  const bronzeUsers = users.filter(u => u.tier === "bronze").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Member Management
          </h1>
          <p className="text-muted-foreground">
            Manage coach tiers and access levels
          </p>
        </div>
      </div>

      {/* Tier Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Gold Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{goldUsers}</div>
            <p className="text-xs text-yellow-600">Priority access to all fields</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Medal className="h-5 w-5 text-gray-400" />
              Silver Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-700">{silverUsers}</div>
            <p className="text-xs text-gray-600">Access to silver & bronze fields</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Bronze Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{bronzeUsers}</div>
            <p className="text-xs text-amber-600">Access to bronze fields only</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>How Tier System Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2 border-yellow-300 bg-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-yellow-700">Gold Coach</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>✓ Access to ALL fields (Gold, Silver, Bronze)</li>
                <li>✓ First priority for booking</li>
                <li>✓ Early booking window</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Medal className="h-5 w-5 text-gray-400" />
                <span className="font-bold text-gray-700">Silver Coach</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Access to Silver & Bronze fields</li>
                <li>✓ Second priority for booking</li>
                <li>✗ No access to Gold fields</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-amber-700">Bronze Coach</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>✓ Access to Bronze fields only</li>
                <li>✓ Standard booking priority</li>
                <li>✗ No access to Gold/Silver fields</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            Click on a member to edit their tier and role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.teamName || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={`${tierColors[user.tier]} border`}>
                      <span className="flex items-center gap-1">
                        {tierIcons[user.tier]}
                        {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member: {editDialog.user?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coach Tier</Label>
              <div className="grid grid-cols-3 gap-2">
                {["gold", "silver", "bronze"].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedTier === tier
                        ? tier === "gold"
                          ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-200"
                          : tier === "silver"
                            ? "border-gray-400 bg-gray-50 ring-2 ring-gray-200"
                            : "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                        : "border-border hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {tierIcons[tier]}
                      <span className="text-sm font-medium capitalize">{tier}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("user")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedRole === "user"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-medium">User (Coach)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("admin")}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedRole === "admin"
                      ? "border-red-400 bg-red-50 ring-2 ring-red-200"
                      : "border-border hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-medium flex items-center justify-center gap-1">
                    <Shield className="h-4 w-4" />
                    Admin
                  </span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={saveUser} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}