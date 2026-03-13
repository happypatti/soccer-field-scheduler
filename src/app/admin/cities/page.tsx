"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  fields?: { id: string }[];
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({ name: "", state: "", country: "USA" });

  useEffect(() => { fetchCities(); }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/cities");
      const data = await res.json();
      setCities(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const url = editingCity ? `/api/cities/${editingCity.id}` : "/api/cities";
      const method = editingCity ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editingCity ? "City updated" : "City created");
      fetchCities();
      closeDialog();
    } catch { toast.error("Failed to save city"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this city? This will also delete all fields and zones in it.")) return;
    try {
      const res = await fetch(`/api/cities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("City deleted");
      fetchCities();
    } catch { toast.error("Failed to delete"); }
  };

  const openEdit = (city: City) => {
    setEditingCity(city);
    setFormData({ name: city.name, state: city.state || "", country: city.country });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCity(null);
    setFormData({ name: "", state: "", country: "USA" });
  };

  const filtered = cities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="animate-pulse h-96 bg-white rounded-lg"></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cities</h1>
          <p className="text-muted-foreground">Manage locations</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add City
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search cities..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No cities found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.state || "-"}</TableCell>
                    <TableCell>{city.country}</TableCell>
                    <TableCell>{city.fields?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(city)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(city.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>City Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Los Angeles" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="California" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="USA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>{editingCity ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}