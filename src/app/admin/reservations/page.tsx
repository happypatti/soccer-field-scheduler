"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, MoveRight, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  user: { id: string; name: string; email: string; teamName: string | null };
  zone: { id: string; name: string; field: { id: string; name: string; city: { name: string } } };
}

interface Zone {
  id: string;
  name: string;
  field: { id: string; name: string };
}

export default function AdminReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Dialogs
  const [denyDialog, setDenyDialog] = useState<{ open: boolean; reservation: Reservation | null; notes: string }>({
    open: false, reservation: null, notes: ""
  });
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; reservation: Reservation | null; targetZoneId: string; reason: string }>({
    open: false, reservation: null, targetZoneId: "", reason: ""
  });
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; reservation: Reservation | null; reason: string }>({
    open: false, reservation: null, reason: ""
  });

  const isGoldAdmin = session?.user?.role === "gold_admin" || session?.user?.role === "admin";
  const isSilverAdmin = session?.user?.role === "silver_admin" || session?.user?.role === "admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resRes, zonesRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/zones"),
      ]);
      const [resData, zonesData] = await Promise.all([resRes.json(), zonesRes.json()]);
      setReservations(Array.isArray(resData) ? resData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Reservation ${status}`);
      fetchData();
      setDenyDialog({ open: false, reservation: null, notes: "" });
    } catch {
      toast.error("Failed to update");
    }
  };

  const moveReservation = async () => {
    if (!moveDialog.reservation || !moveDialog.targetZoneId) return;
    try {
      const res = await fetch(`/api/reservations/${moveDialog.reservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          moveToZoneId: moveDialog.targetZoneId, 
          moveReason: moveDialog.reason 
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Reservation moved successfully");
      fetchData();
      setMoveDialog({ open: false, reservation: null, targetZoneId: "", reason: "" });
    } catch {
      toast.error("Failed to move reservation");
    }
  };

  const cancelReservation = async () => {
    if (!cancelDialog.reservation) return;
    try {
      const res = await fetch(`/api/reservations/${cancelDialog.reservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", adminNotes: cancelDialog.reason }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Reservation cancelled");
      fetchData();
      setCancelDialog({ open: false, reservation: null, reason: "" });
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.zone.field.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      pending_gold: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    const labels: Record<string, string> = {
      pending: "Pending Silver",
      pending_gold: "Pending Gold",
      approved: "Approved",
      denied: "Denied",
      cancelled: "Cancelled",
    };
    return <Badge className={styles[status] || "bg-gray-100"}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-white rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-muted-foreground">Manage all booking requests</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, field..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="border rounded-md px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending Silver</option>
          <option value="pending_gold">Pending Gold</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filteredReservations.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No reservations found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.user.name}</p>
                        <p className="text-xs text-muted-foreground">{r.user.email}</p>
                        {r.user.teamName && <p className="text-xs text-muted-foreground">{r.user.teamName}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.zone.field.name}</p>
                        <p className="text-xs text-muted-foreground">{r.zone.name} • {r.zone.field.city.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.date}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(r.startTime)} - {formatTime(r.endTime)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {/* Silver admin can approve pending -> pending_gold */}
                        {r.status === "pending" && isSilverAdmin && (
                          <Button size="sm" onClick={() => updateStatus(r.id, "pending_gold")} title="Approve (1st level)">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Gold admin can approve pending_gold -> approved OR skip directly */}
                        {(r.status === "pending_gold" || r.status === "pending") && isGoldAdmin && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(r.id, "approved")} title="Final Approve">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Deny */}
                        {(r.status === "pending" || r.status === "pending_gold") && (
                          <Button size="sm" variant="destructive" onClick={() => setDenyDialog({ open: true, reservation: r, notes: "" })} title="Deny">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Move */}
                        {r.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => setMoveDialog({ open: true, reservation: r, targetZoneId: "", reason: "" })} title="Move">
                            <MoveRight className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Cancel */}
                        {(r.status === "approved" || r.status === "pending" || r.status === "pending_gold") && (
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setCancelDialog({ open: true, reservation: r, reason: "" })} title="Cancel">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deny Dialog */}
      <Dialog open={denyDialog.open} onOpenChange={(o) => setDenyDialog({ ...denyDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deny Reservation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input 
                value={denyDialog.notes} 
                onChange={(e) => setDenyDialog({ ...denyDialog, notes: e.target.value })}
                placeholder="Why is this being denied?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialog({ open: false, reservation: null, notes: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => denyDialog.reservation && updateStatus(denyDialog.reservation.id, "denied", denyDialog.notes)}>
              Deny Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveDialog.open} onOpenChange={(o) => setMoveDialog({ ...moveDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move Reservation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Move to Zone</Label>
              <select 
                className="w-full border rounded-md p-2"
                value={moveDialog.targetZoneId}
                onChange={(e) => setMoveDialog({ ...moveDialog, targetZoneId: e.target.value })}
              >
                <option value="">Select a zone</option>
                {zones.filter(z => z.id !== moveDialog.reservation?.zone.id).map((z) => (
                  <option key={z.id} value={z.id}>{z.field?.name} - {z.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                value={moveDialog.reason} 
                onChange={(e) => setMoveDialog({ ...moveDialog, reason: e.target.value })}
                placeholder="e.g., Field maintenance, scheduling conflict..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog({ open: false, reservation: null, targetZoneId: "", reason: "" })}>Cancel</Button>
            <Button onClick={moveReservation} disabled={!moveDialog.targetZoneId}>Move Reservation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(o) => setCancelDialog({ ...cancelDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Reservation</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will notify the coach and other coaches on this field about the cancellation.</p>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                value={cancelDialog.reason} 
                onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
                placeholder="e.g., Weather conditions, field closure..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, reservation: null, reason: "" })}>Back</Button>
            <Button variant="destructive" onClick={cancelReservation}>Cancel Reservation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}