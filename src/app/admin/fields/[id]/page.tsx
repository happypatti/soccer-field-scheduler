"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Save, Plus, Trash2, Move } from "lucide-react";
import { toast } from "sonner";

interface Zone {
  id: string;
  name: string;
  posLeft: number | null;
  posTop: number | null;
  posWidth: number | null;
  posHeight: number | null;
  isActive: boolean;
}

interface Field {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  aboutInfo: string | null;
  imageUrl: string | null;
  allowedTiers: string;
  isActive: boolean;
  zones: Zone[];
}

const tierOptions = [
  { value: "all", label: "All Coaches", description: "Gold, Silver & Bronze", color: "border-green-400 bg-green-50" },
  { value: "gold", label: "Gold Only", description: "Gold coaches only", color: "border-yellow-400 bg-yellow-50" },
  { value: "gold_silver", label: "Gold & Silver", description: "Gold + Silver coaches", color: "border-yellow-400 bg-gradient-to-r from-yellow-50 to-gray-50" },
  { value: "silver", label: "Silver Only", description: "Silver coaches only", color: "border-gray-400 bg-gray-50" },
  { value: "silver_bronze", label: "Silver & Bronze", description: "Silver + Bronze coaches", color: "border-gray-400 bg-gradient-to-r from-gray-50 to-amber-50" },
  { value: "bronze", label: "Bronze Only", description: "Bronze coaches only", color: "border-amber-400 bg-amber-50" },
];

export default function AdminFieldEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [field, setField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Editable field details
  const [fieldName, setFieldName] = useState("");
  const [fieldAddress, setFieldAddress] = useState("");
  const [fieldDescription, setFieldDescription] = useState("");
  const [fieldAboutInfo, setFieldAboutInfo] = useState("");
  const [selectedTier, setSelectedTier] = useState("all");
  const [isActive, setIsActive] = useState(true);
  
  // Zone being dragged/resized
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoneEdits, setZoneEdits] = useState<Record<string, { left: number; top: number; width: number; height: number }>>({});
  
  // Add zone dialog
  const [addZoneDialogOpen, setAddZoneDialogOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [isDeletingZone, setIsDeletingZone] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "silver_admin" || session?.user?.role === "gold_admin";

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !isAdmin) {
      toast.error("Access denied. Admin only.");
      router.push("/");
      return;
    }

    fetchField();
  }, [session, status, router, params.id, isAdmin]);

  const fetchField = async () => {
    try {
      const response = await fetch(`/api/fields/${params.id}`);
      const data = await response.json();
      setField(data);
      
      // Set editable field values
      setFieldName(data.name || "");
      setFieldAddress(data.address || "");
      setFieldDescription(data.description || "");
      setFieldAboutInfo(data.aboutInfo || "");
      setSelectedTier(data.allowedTiers || "all");
      setIsActive(data.isActive !== false);
      
      // Initialize zone edits with current positions
      const edits: Record<string, { left: number; top: number; width: number; height: number }> = {};
      data.zones?.forEach((zone: Zone) => {
        edits[zone.id] = {
          left: zone.posLeft || 10,
          top: zone.posTop || 10,
          width: zone.posWidth || 30,
          height: zone.posHeight || 30,
        };
      });
      setZoneEdits(edits);
      
      if (data.imageUrl) {
        setImagePreview(data.imageUrl);
      }
    } catch (error) {
      console.error("Error fetching field:", error);
      toast.error("Failed to load field");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const saveField = async () => {
    if (!field) return;
    
    setIsSaving(true);
    try {
      // Upload image if new one selected
      let imageUrl = field.imageUrl;
      if (imageFile) {
        imageUrl = await handleImageUpload();
      }
      
      // Update field with all details
      const fieldResponse = await fetch(`/api/fields/${field.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: fieldName,
          address: fieldAddress,
          description: fieldDescription,
          aboutInfo: fieldAboutInfo,
          imageUrl, 
          allowedTiers: selectedTier,
          isActive,
        }),
      });
      
      if (!fieldResponse.ok) {
        throw new Error("Failed to update field");
      }
      
      // Update all zone positions
      for (const zone of field.zones) {
        const edit = zoneEdits[zone.id];
        if (edit) {
          await fetch(`/api/zones/${zone.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              posLeft: Math.round(edit.left),
              posTop: Math.round(edit.top),
              posWidth: Math.round(edit.width),
              posHeight: Math.round(edit.height),
            }),
          });
        }
      }
      
      toast.success("Field saved successfully!");
      fetchField();
    } catch (error) {
      console.error("Error saving field:", error);
      toast.error("Failed to save field");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.preventDefault();
    setSelectedZone(zoneId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedZone) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / container.width) * 100;
    const dy = ((e.clientY - dragStart.y) / container.height) * 100;
    
    setZoneEdits(prev => ({
      ...prev,
      [selectedZone]: {
        ...prev[selectedZone],
        left: Math.max(0, Math.min(100 - prev[selectedZone].width, prev[selectedZone].left + dx)),
        top: Math.max(0, Math.min(100 - prev[selectedZone].height, prev[selectedZone].top + dy)),
      }
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateZoneSize = (zoneId: string, dimension: 'width' | 'height', value: number) => {
    setZoneEdits(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        [dimension]: Math.max(5, Math.min(100, value)),
      }
    }));
  };

  const addZone = async () => {
    if (!newZoneName.trim() || !field) return;
    
    setIsAddingZone(true);
    try {
      const response = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: field.id,
          name: newZoneName.trim(),
          posLeft: 10 + (field.zones.length * 10) % 50,
          posTop: 10 + (field.zones.length * 10) % 50,
          posWidth: 30,
          posHeight: 30,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create zone");
      }

      toast.success("Zone added!");
      setNewZoneName("");
      setAddZoneDialogOpen(false);
      fetchField();
    } catch (error) {
      console.error("Error adding zone:", error);
      toast.error("Failed to add zone");
    } finally {
      setIsAddingZone(false);
    }
  };

  const deleteZone = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    
    setIsDeletingZone(zoneId);
    try {
      const response = await fetch(`/api/zones/${zoneId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete zone");
      toast.success("Zone deleted!");
      if (selectedZone === zoneId) setSelectedZone(null);
      fetchField();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("Failed to delete zone");
    } finally {
      setIsDeletingZone(null);
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

  if (!field) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Field not found</h1>
        <Link href="/admin/all-fields">
          <Button className="mt-4">Back to Fields</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/all-fields">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Field</h1>
          <p className="text-muted-foreground">Update field details and zone positions</p>
        </div>
        <Button onClick={saveField} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Field Details */}
        <Card>
          <CardHeader>
            <CardTitle>Field Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Field Name *</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Soccer Field Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={fieldAddress}
                onChange={(e) => setFieldAddress(e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={fieldDescription}
                onChange={(e) => setFieldDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            
            <div className="space-y-2">
              <Label>About This Field (detailed)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[100px]"
                value={fieldAboutInfo}
                onChange={(e) => setFieldAboutInfo(e.target.value)}
                placeholder="Detailed information about amenities, parking, rules..."
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Field is Active (visible to coaches)</Label>
            </div>

            <div className="space-y-2">
              <Label>Who can book this field?</Label>
              <div className="grid grid-cols-2 gap-2">
                {tierOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedTier(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedTier === option.value
                        ? `${option.color} ring-2 ring-offset-1`
                        : "border-border hover:border-gray-400"
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image & Zones */}
        <Card>
          <CardHeader>
            <CardTitle>Field Image & Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload Image
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imageFile && <span className="text-sm text-muted-foreground self-center">{imageFile.name}</span>}
            </div>

            <div
              className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border bg-gray-100"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {imagePreview ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Upload an image to position zones
                </div>
              )}

              {field.zones.map((zone) => {
                const edit = zoneEdits[zone.id] || { left: 10, top: 10, width: 30, height: 30 };
                const isSelected = selectedZone === zone.id;
                
                return (
                  <div
                    key={zone.id}
                    className={`absolute cursor-move transition-colors ${
                      isSelected ? "bg-blue-500/50 border-2 border-blue-500" : "bg-green-500/30 border-2 border-green-400 hover:bg-green-500/40"
                    }`}
                    style={{ left: `${edit.left}%`, top: `${edit.top}%`, width: `${edit.width}%`, height: `${edit.height}%` }}
                    onMouseDown={(e) => handleMouseDown(e, zone.id)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">{zone.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zone Settings</CardTitle>
          <Button size="sm" onClick={() => setAddZoneDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          {field.zones.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No zones. Click "Add Zone" to create one.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {field.zones.map((zone) => {
                const edit = zoneEdits[zone.id] || { left: 10, top: 10, width: 30, height: 30 };
                const isSelected = selectedZone === zone.id;
                
                return (
                  <div
                    key={zone.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${isSelected ? "border-blue-500 bg-blue-50" : "border-border hover:border-gray-400"}`}
                    onClick={() => setSelectedZone(zone.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{zone.name}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label className="text-xs">Left %</Label>
                        <Input type="number" min="0" max="100" value={Math.round(edit.left)} onChange={(e) => setZoneEdits(prev => ({ ...prev, [zone.id]: { ...edit, left: parseInt(e.target.value) || 0 } }))} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Top %</Label>
                        <Input type="number" min="0" max="100" value={Math.round(edit.top)} onChange={(e) => setZoneEdits(prev => ({ ...prev, [zone.id]: { ...edit, top: parseInt(e.target.value) || 0 } }))} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Width %</Label>
                        <Input type="number" min="5" max="100" value={Math.round(edit.width)} onChange={(e) => updateZoneSize(zone.id, 'width', parseInt(e.target.value) || 20)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Height %</Label>
                        <Input type="number" min="5" max="100" value={Math.round(edit.height)} onChange={(e) => updateZoneSize(zone.id, 'height', parseInt(e.target.value) || 20)} className="h-8" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Zone Dialog */}
      <Dialog open={addZoneDialogOpen} onOpenChange={setAddZoneDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Zone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Zone Name</Label>
              <Input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="Field A, Field B, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddZoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={addZone} disabled={!newZoneName.trim() || isAddingZone}>{isAddingZone ? "Adding..." : "Add Zone"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}