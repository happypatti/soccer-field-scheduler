"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Check, X, Plus, MapPin, Building, Layers, User, Edit } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Zone {
  id: string;
  name: string;
  field: {
    id: string;
    name: string;
    city: {
      id: string;
      name: string;
    };
  };
}

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  user: User;
  zone: Zone;
  createdAt: string;
}

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
}

interface Field {
  id: string;
  name: string;
  address: string | null;
  cityId: string;
  city: City;
  isActive: boolean;
}

interface ZoneItem {
  id: string;
  name: string;
  description: string | null;
  fieldId: string;
  capacity: number | null;
  pricePerHour: number | null;
  isActive: boolean;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  denied: "destructive",
  cancelled: "outline",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [adminNotesDialog, setAdminNotesDialog] = useState<{ open: boolean; reservation: Reservation | null; notes: string }>({
    open: false,
    reservation: null,
    notes: "",
  });
  
  // Form states
  const [newCity, setNewCity] = useState({ name: "", state: "", country: "USA" });
  const [newField, setNewField] = useState({ name: "", address: "", description: "", cityId: "" });
  const [newZone, setNewZone] = useState({ name: "", description: "", capacity: "", pricePerHour: "", fieldId: "" });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      toast.error("Access denied. Admin only.");
      router.push("/");
      return;
    }

    fetchAllData();
  }, [session, status, router]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [reservationsRes, citiesRes, fieldsRes, zonesRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/cities"),
        fetch("/api/fields"),
        fetch("/api/zones"),
      ]);

      const [reservationsData, citiesData, fieldsData, zonesData] = await Promise.all([
        reservationsRes.json(),
        citiesRes.json(),
        fieldsRes.json(),
        zonesRes.json(),
      ]);

      setReservations(reservationsData);
      setCities(citiesData);
      setFields(fieldsData);
      setZones(zonesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservationStatus = async (id: string, newStatus: string, adminNotes?: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to update reservation");
        return;
      }

      toast.success(`Reservation ${newStatus}`);
      setReservations(
        reservations.map((r) =>
          r.id === id ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes } : r
        )
      );
      setAdminNotesDialog({ open: false, reservation: null, notes: "" });
    } catch {
      toast.error("Something went wrong");
    }
  };

  const createCity = async () => {
    try {
      const response = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCity),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create city");
        return;
      }

      const city = await response.json();
      setCities([...cities, city]);
      setNewCity({ name: "", state: "", country: "USA" });
      setCityDialogOpen(false);
      toast.success("City created successfully");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const createField = async () => {
    try {
      const response = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newField),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create field");
        return;
      }

      toast.success("Field created successfully");
      setNewField({ name: "", address: "", description: "", cityId: "" });
      setFieldDialogOpen(false);
      fetchAllData();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const createZone = async () => {
    try {
      const response = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newZone,
          capacity: newZone.capacity ? parseInt(newZone.capacity) : null,
          pricePerHour: newZone.pricePerHour ? parseInt(newZone.pricePerHour) * 100 : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create zone");
        return;
      }

      toast.success("Zone created successfully");
      setNewZone({ name: "", description: "", capacity: "", pricePerHour: "", fieldId: "" });
      setZoneDialogOpen(false);
      fetchAllData();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const pendingReservations = reservations.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage reservations, cities, fields, and zones
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReservations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fields.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reservations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reservations">
            Reservations ({pendingReservations.length} pending)
          </TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
        </TabsList>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Reservations</CardTitle>
              <CardDescription>
                Review and manage reservation requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reservations yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reservation.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {reservation.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reservation.zone.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {reservation.zone.field.name} • {reservation.zone.field.city.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{formatDate(reservation.date)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[reservation.status]}>
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reservation.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateReservationStatus(reservation.id, "approved")
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setAdminNotesDialog({
                                    open: true,
                                    reservation,
                                    notes: "",
                                  })
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCityDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {cities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No cities yet. Add your first city!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Country</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell>{city.state || "-"}</TableCell>
                        <TableCell>{city.country}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setFieldDialogOpen(true)} disabled={cities.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
          {cities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add a city first before creating fields.
            </p>
          )}
          <Card>
            <CardContent className="pt-6">
              {fields.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No fields yet. Add your first field!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>{field.city.name}</TableCell>
                        <TableCell>{field.address || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={field.isActive ? "default" : "secondary"}>
                            {field.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/fields/${field.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setZoneDialogOpen(true)} disabled={fields.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add a field first before creating zones.
            </p>
          )}
          <Card>
            <CardContent className="pt-6">
              {zones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No zones yet. Add your first zone!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>{(zone as any).field?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={zone.isActive ? "default" : "secondary"}>
                            {zone.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add City Dialog */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">City Name</Label>
              <Input
                id="cityName"
                value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                placeholder="Los Angeles"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cityState">State</Label>
              <Input
                id="cityState"
                value={newCity.state}
                onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}
                placeholder="California"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cityCountry">Country</Label>
              <Input
                id="cityCountry"
                value={newCity.country}
                onChange={(e) => setNewCity({ ...newCity, country: e.target.value })}
                placeholder="USA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createCity} disabled={!newCity.name}>
              Create City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldCity">City</Label>
              <select
                id="fieldCity"
                className="w-full p-2 border rounded-md"
                value={newField.cityId}
                onChange={(e) => setNewField({ ...newField, cityId: e.target.value })}
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="Central Park Soccer Field"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldAddress">Address</Label>
              <Input
                id="fieldAddress"
                value={newField.address}
                onChange={(e) => setNewField({ ...newField, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldDescription">Description</Label>
              <Input
                id="fieldDescription"
                value={newField.description}
                onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                placeholder="Professional soccer field with lights"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createField} disabled={!newField.name || !newField.cityId}>
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zoneField">Field</Label>
              <select
                id="zoneField"
                className="w-full p-2 border rounded-md"
                value={newZone.fieldId}
                onChange={(e) => setNewZone({ ...newZone, fieldId: e.target.value })}
              >
                <option value="">Select a field</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.city.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoneName">Zone Name</Label>
              <Input
                id="zoneName"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="Field A, Field B, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createZone} disabled={!newZone.name || !newZone.fieldId}>
              Create Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog for Denial */}
      <Dialog
        open={adminNotesDialog.open}
        onOpenChange={(open) =>
          setAdminNotesDialog({ ...adminNotesDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Reservation</DialogTitle>
            <DialogDescription>
              Optionally add a reason for denying this reservation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Reason (Optional)</Label>
              <Input
                id="adminNotes"
                value={adminNotesDialog.notes}
                onChange={(e) =>
                  setAdminNotesDialog({ ...adminNotesDialog, notes: e.target.value })
                }
                placeholder="Time slot not available, maintenance, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAdminNotesDialog({ open: false, reservation: null, notes: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (adminNotesDialog.reservation) {
                  updateReservationStatus(
                    adminNotesDialog.reservation.id,
                    "denied",
                    adminNotesDialog.notes
                  );
                }
              }}
            >
              Deny Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}