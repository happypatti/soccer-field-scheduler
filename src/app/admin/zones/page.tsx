"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Zone {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  field: { id: string; name: string; city: { name: string } };
}

interface Field {
  id: string;
  name: string;
  city: { name: string };
}

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", fieldId: "", isActive: true });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [zRes, fRes] = await Promise.all([fetch("/api/zones"), fetch("/api/fields")]);
      const [zData, fData] = await Promise.all([zRes.json(), fRes.json()]);
      setZones(Array.isArray(zData) ? zData : []);
      setFields(Array.isArray(fData) ? fData : []);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const url = editingZone ? `/api/zones/${editingZone.id}` : "/api/zones";
      const method = editingZone ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingZone ? "Zone updated" : "Zone created");
      fetchData();
      closeDialog();
    } catch { toast.error("Failed to save zone"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    try {
      const res = await fetch(`/api/zones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Zone deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const toggleActive = async (zone: Zone) => {
    try {
      const res = await fetch(`/api/zones/${zone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(zone.isActive ? "Zone deactivated" : "Zone activated");
      fetchData();
    } catch { toast.error("Failed to update"); }
  };

  const openEdit = (zone: Zone) => {
    setEditingZone(zone);
    setFormData({ name: zone.name, description: zone.description || "", fieldId: zone.field.id, isActive: zone.isActive });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingZone(null);
    setFormData({ name: "", description: "", fieldId: "", isActive: true });
  };

  const filtered = zones.filter(z => 
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.field.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="animate-pulse h-96 bg-white rounded-lg"></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zones</h1>
          <p className="text-muted-foreground">Manage field zones</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={fields.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Add Zone
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          You need to create a field first before adding zones.
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search zones..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No zones found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <div>
                        <p>{zone.field.name}</p>
                        <p className="text-xs text-muted-foreground">{zone.field.city.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{zone.description || "-"}</TableCell>
                    <TableCell>
                      <Badge className={zone.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {zone.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(zone)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(zone)}>
                          {zone.isActive ? "Off" : "On"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(zone.id)}><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editingZone ? "Edit Zone" : "Add Zone"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {!editingZone && (
              <div className="space-y-2">
                <Label>Field *</Label>
                <select className="w-full border rounded-md p-2" value={formData.fieldId} onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}>
                  <option value="">Select a field</option>
                  {fields.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.city?.name})</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Zone Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., North Field, Zone A, etc." />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea 
                className="w-full border rounded-md p-2 min-h-[80px]" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Size, surface type, amenities..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || (!editingZone && !formData.fieldId)}>
              {editingZone ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}