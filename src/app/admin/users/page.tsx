"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Shield, User, Users } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  teamName: string | null;
  phone: string | null;
  role: string;
  tier: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: UserData | null; tier: string; role: string }>({
    open: false, user: null, tier: "", role: ""
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editDialog.user) return;
    try {
      const res = await fetch(`/api/users/${editDialog.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: editDialog.tier, role: editDialog.role }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("User updated");
      fetchUsers();
      setEditDialog({ open: false, user: null, tier: "", role: "" });
    } catch { toast.error("Failed to update user"); }
  };

  const openEdit = (user: UserData) => {
    setEditDialog({ open: true, user, tier: user.tier, role: user.role });
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
      silver: "bg-gray-100 text-gray-800 border-gray-300",
      bronze: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return <Badge className={`${colors[tier] || "bg-gray-100"} border`}>{tier}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      user: "bg-blue-50 text-blue-700",
      silver_admin: "bg-gray-100 text-gray-700 border border-gray-300",
      gold_admin: "bg-yellow-100 text-yellow-800 border border-yellow-400",
      admin: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      user: "Coach",
      silver_admin: "Silver Admin",
      gold_admin: "Gold Admin",
      admin: "Super Admin",
    };
    return <Badge className={styles[role] || "bg-gray-100"}>{labels[role] || role}</Badge>;
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.teamName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesTier = tierFilter === "all" || u.tier === tierFilter;
    return matchesSearch && matchesRole && matchesTier;
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-white rounded-lg"></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-muted-foreground">Manage coaches and admins</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.tier === "gold").length}</p>
                <p className="text-sm text-muted-foreground">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.tier === "silver").length}</p>
                <p className="text-sm text-muted-foreground">Silver</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.tier === "bronze").length}</p>
                <p className="text-sm text-muted-foreground">Bronze</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, team..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="border rounded-md px-3 py-2" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="user">Coaches</option>
          <option value="silver_admin">Silver Admin</option>
          <option value="gold_admin">Gold Admin</option>
          <option value="admin">Super Admin</option>
        </select>
        <select className="border rounded-md px-3 py-2" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="all">All Tiers</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{user.email}</p>
                        {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{user.teamName || "-"}</TableCell>
                    <TableCell>{getTierBadge(user.tier)}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => setEditDialog({ ...editDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{editDialog.user?.name}</p>
              <p className="text-sm text-muted-foreground">{editDialog.user?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Membership Tier</Label>
              <select 
                className="w-full border rounded-md p-2" 
                value={editDialog.tier} 
                onChange={(e) => setEditDialog({ ...editDialog, tier: e.target.value })}
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
              <p className="text-xs text-muted-foreground">Tier determines which fields they can book</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select 
                className="w-full border rounded-md p-2" 
                value={editDialog.role} 
                onChange={(e) => setEditDialog({ ...editDialog, role: e.target.value })}
              >
                <option value="user">Coach (Regular User)</option>
                <option value="silver_admin">Silver Admin (1st Level Approver)</option>
                <option value="gold_admin">Gold Admin (Final Approver)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {editDialog.role === "user" && "Can book fields and manage their reservations"}
                {editDialog.role === "silver_admin" && "Can give first-level approval to reservations"}
                {editDialog.role === "gold_admin" && "Can give final approval and access all admin features"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null, tier: "", role: "" })}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}