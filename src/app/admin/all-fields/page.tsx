"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Field {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  aboutInfo: string | null;
  imageUrl: string | null;
  allowedTiers: string;
  isActive: boolean;
  city: { id: string; name: string };
  zones: { id: string }[];
}

interface City {
  id: string;
  name: string;
}

const tierLabels: Record<string, string> = {
  all: "All Coaches",
  gold: "Gold Only",
  gold_silver: "Gold & Silver",
  silver: "Silver Only",
  silver_bronze: "Silver & Bronze",
  bronze: "Bronze Only",
};

export default function AdminFieldsPage() {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", address: "", description: "", aboutInfo: "", cityId: "", allowedTiers: "all", isActive: true 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fRes, cRes] = await Promise.all([fetch("/api/fields"), fetch("/api/cities")]);
      const [fData, cData] = await Promise.all([fRes.json(), cRes.json()]);
      setFields(Array.isArray(fData) ? fData : []);
      setCities(Array.isArray(cData) ? cData : []);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Field created");
      fetchData();
      closeDialog();
    } catch { toast.error("Failed to create field"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this field? This will also delete all zones in it.")) return;
    try {
      const res = await fetch(`/api/fields/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Field deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const toggleActive = async (field: Field) => {
    try {
      const res = await fetch(`/api/fields/${field.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !field.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(field.isActive ? "Field deactivated" : "Field activated");
      fetchData();
    } catch { toast.error("Failed to update"); }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData({ name: "", address: "", description: "", aboutInfo: "", cityId: "", allowedTiers: "all", isActive: true });
  };

  const filtered = fields.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="animate-pulse h-96 bg-white rounded-lg"></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fields</h1>
          <p className="text-muted-foreground">Manage all soccer fields</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={cities.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      {cities.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          You need to create a city first before adding fields.
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search fields..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No fields found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{field.name}</p>
                        {field.address && <p className="text-xs text-muted-foreground">{field.address}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{field.city.name}</TableCell>
                    <TableCell>{field.zones?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{tierLabels[field.allowedTiers] || field.allowedTiers}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={field.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {field.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/fields/${field.id}`)} title="Edit Details"><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/fields/${field.id}`)} title="View"><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(field)} title={field.isActive ? "Deactivate" : "Activate"}>
                          {field.isActive ? "Off" : "On"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(field.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Field</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>City *</Label>
              <select className="w-full border rounded-md p-2" value={formData.cityId} onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}>
                <option value="">Select a city</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Field Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Soccer Field Name" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St" />
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="space-y-2">
              <Label>About This Field (detailed info)</Label>
              <textarea 
                className="w-full border rounded-md p-2 min-h-[100px]" 
                value={formData.aboutInfo} 
                onChange={(e) => setFormData({ ...formData, aboutInfo: e.target.value })} 
                placeholder="Detailed information about amenities, rules, parking..."
              />
            </div>
            <div className="space-y-2">
              <Label>Who Can Book?</Label>
              <select className="w-full border rounded-md p-2" value={formData.allowedTiers} onChange={(e) => setFormData({ ...formData, allowedTiers: e.target.value })}>
                <option value="all">All Coaches</option>
                <option value="gold">Gold Only</option>
                <option value="gold_silver">Gold & Silver</option>
                <option value="silver">Silver Only</option>
                <option value="silver_bronze">Silver & Bronze</option>
                <option value="bronze">Bronze Only</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.cityId}>Create Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}