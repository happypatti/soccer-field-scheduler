"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Calendar, Layers, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";

interface City { id: string; name: string; }
interface Zone { id: string; name: string; description: string | null; capacity: number | null; pricePerHour: number | null; posLeft: number | null; posTop: number | null; posWidth: number | null; posHeight: number | null; isActive: boolean; }
interface Field { id: string; name: string; address: string | null; description: string | null; imageUrl: string | null; isActive: boolean; city: City; zones: Zone[]; }
interface FieldReservation { id: string; date: string; startTime: string; endTime: string; status: string; zoneId: string; user: { id: string; name: string; teamName: string | null }; zone: { id: string; name: string }; }

function InteractiveSatelliteMap({ zones, selectedZone, onZoneClick, imageUrl, fieldName }: { zones: Zone[]; selectedZone: Zone | null; onZoneClick: (zone: Zone) => void; imageUrl?: string | null; fieldName: string; }) {
  const activeZones = zones.filter(z => z.isActive);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const isOtisField = imageUrl?.includes('otis');
  
  const getZonePosition = (zoneName: string, index: number, total: number) => {
    if (isOtisField) {
      const otisPositions: Record<string, { left: string; top: string; width: string; height: string }> = { 'Field A': { left: '5%', top: '5%', width: '40%', height: '40%' }, 'Field B': { left: '55%', top: '30%', width: '40%', height: '35%' }, 'Field C': { left: '55%', top: '60%', width: '40%', height: '35%' } };
      if (otisPositions[zoneName]) return otisPositions[zoneName];
    }
    const johnMuirPositions: Record<string, { left: string; top: string; width: string; height: string }> = { 'Field A': { left: '5%', top: '5%', width: '40%', height: '40%' }, 'Field B': { left: '5%', top: '55%', width: '40%', height: '40%' }, 'Field C': { left: '55%', top: '55%', width: '40%', height: '40%' } };
    if (johnMuirPositions[zoneName]) return johnMuirPositions[zoneName];
    if (total === 1) return { left: '5%', top: '5%', width: '40%', height: '40%' };
    if (index === 0) return { left: '5%', top: '5%', width: '40%', height: '40%' };
    if (index === 1) return { left: '5%', top: '55%', width: '40%', height: '40%' };
    return { left: '55%', top: '55%', width: '40%', height: '40%' };
  };

  const backgroundImage = imageUrl || '/fields/john_muir.png';
  
  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-border shadow-lg bg-gray-100">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-700/20 to-green-900/20"></div>
        </div>
        {activeZones.map((zone, index) => {
          const hasDbPosition = zone.posLeft !== null && zone.posTop !== null && zone.posWidth !== null && zone.posHeight !== null;
          const position = hasDbPosition ? { left: `${zone.posLeft}%`, top: `${zone.posTop}%`, width: `${zone.posWidth}%`, height: `${zone.posHeight}%` } : getZonePosition(zone.name, index, activeZones.length);
          const isSelected = selectedZone?.id === zone.id;
          const isHovered = hoveredZone === zone.id;
          return (
            <button key={zone.id} onClick={() => onZoneClick(zone)} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)}
              className={`absolute transition-all duration-300 rounded-lg flex flex-col items-center justify-center ${isSelected ? 'bg-blue-500/60 border-4 border-blue-400 ring-4 ring-blue-400/50' : isHovered ? 'bg-green-500/50 border-3 border-green-300' : 'bg-white/20 border-2 border-white/70 hover:bg-white/30'}`}
              style={{ left: position.left, top: position.top, width: position.width, height: position.height }}>
              <div className={`px-3 py-2 rounded-lg backdrop-blur-sm ${isSelected ? 'bg-blue-900/80' : 'bg-black/60'}`}>
                <span className="text-white font-bold text-sm">{zone.name}</span>
              </div>
            </button>
          );
        })}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          <span className="text-xs font-medium text-gray-700">{fieldName}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-white/90 text-xs text-center">📍 Click on a zone to select it for booking</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white/30 border border-white/70"></div><span>Available</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500/50 border border-green-300"></div><span>Hover</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500/60 border-2 border-blue-400"></div><span>Selected</span></div>
      </div>
    </div>
  );
}

function ZoneSelectionCard({ zone, isSelected, onClick }: { zone: Zone; isSelected: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
          </div>
          <div>
            <p className="font-semibold">{zone.name}</p>
            {zone.description && <p className="text-sm text-muted-foreground mt-0.5">{zone.description}</p>}
          </div>
        </div>
        <Badge variant={zone.isActive ? "default" : "secondary"}>{zone.isActive ? "Available" : "Unavailable"}</Badge>
      </div>
    </button>
  );
}

export default function FieldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [field, setField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationData, setReservationData] = useState({ date: "", timeSlot: "", notes: "" });
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [fieldReservations, setFieldReservations] = useState<FieldReservation[]>([]);
  const [isLoadingFieldRes, setIsLoadingFieldRes] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueData, setIssueData] = useState({ issueType: "", description: "" });
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const TIME_SLOTS = [
    { id: "18:00-19:30", label: "6:00 PM - 7:30 PM", startTime: "18:00", endTime: "19:30" },
    { id: "19:30-21:00", label: "7:30 PM - 9:00 PM", startTime: "19:30", endTime: "21:00" },
  ];

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!reservationData.date || !selectedZone) { setBookedSlots([]); return; }
      setIsLoadingSlots(true);
      try {
        const response = await fetch(`/api/reservations?zoneId=${selectedZone.id}&date=${reservationData.date}`);
        const reservations = await response.json();
        const booked = (Array.isArray(reservations) ? reservations : []).filter((r: any) => r.status === "approved" || r.status === "pending" || r.status === "pending_gold").map((r: any) => `${r.startTime}-${r.endTime}`);
        setBookedSlots(booked);
      } catch { setBookedSlots([]); } finally { setIsLoadingSlots(false); }
    };
    fetchBookedSlots();
  }, [reservationData.date, selectedZone]);

  useEffect(() => {
    const fetchFieldReservations = async () => {
      if (!reservationData.date || !field) { setFieldReservations([]); return; }
      setIsLoadingFieldRes(true);
      try {
        const response = await fetch(`/api/reservations?fieldId=${field.id}&date=${reservationData.date}`);
        const reservations = await response.json();
        setFieldReservations(Array.isArray(reservations) ? reservations : []);
      } catch { setFieldReservations([]); } finally { setIsLoadingFieldRes(false); }
    };
    fetchFieldReservations();
  }, [reservationData.date, field]);

  const isDateAllowed = (dateString: string) => { const date = new Date(dateString + "T00:00:00"); const dayOfWeek = date.getDay(); return dayOfWeek !== 0 && dayOfWeek !== 6; };
  const getMinDate = () => { const today = new Date(); const minDate = new Date(today); if (minDate.getDay() === 6) minDate.setDate(minDate.getDate() + 2); else if (minDate.getDay() === 0) minDate.setDate(minDate.getDate() + 1); return minDate.toISOString().split("T")[0]; };

  useEffect(() => {
    const fetchField = async () => {
      try { const response = await fetch(`/api/fields/${params.id}`); const data = await response.json(); setField(data); } catch { } finally { setIsLoading(false); }
    };
    if (params.id) fetchField();
  }, [params.id]);

  const handleReservation = async () => {
    if (!session) { toast.error("Please sign in"); router.push("/login"); return; }
    if (!selectedZone || !reservationData.date || !reservationData.timeSlot) { toast.error("Please fill in all fields"); return; }
    if (!isDateAllowed(reservationData.date)) { toast.error("Bookings Mon-Fri only"); return; }
    const selectedSlot = TIME_SLOTS.find(slot => slot.id === reservationData.timeSlot);
    if (!selectedSlot) { toast.error("Invalid time slot"); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zoneId: selectedZone.id, date: reservationData.date, startTime: selectedSlot.startTime, endTime: selectedSlot.endTime, notes: reservationData.notes }) });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error || "Failed"); return; }
      toast.success("Reservation submitted!");
      setIsDialogOpen(false);
      setReservationData({ date: "", timeSlot: "", notes: "" });
      router.push("/reservations");
    } catch { toast.error("Error"); } finally { setIsSubmitting(false); }
  };

  const openReservationDialog = (zone: Zone) => { if (!session) { toast.error("Please sign in"); router.push("/login"); return; } setSelectedZone(zone); setIsDialogOpen(true); };

  const submitFieldIssue = async () => {
    if (!session) { toast.error("Please sign in"); router.push("/login"); return; }
    if (!issueData.issueType || !issueData.description.trim()) { toast.error("Please fill all fields"); return; }
    setIsSubmittingIssue(true);
    try {
      const response = await fetch("/api/field-issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fieldId: field?.id, issueType: issueData.issueType, description: issueData.description }) });
      if (!response.ok) throw new Error("Failed");
      toast.success("Issue reported!");
      setIssueDialogOpen(false);
      setIssueData({ issueType: "", description: "" });
    } catch { toast.error("Failed"); } finally { setIsSubmittingIssue(false); }
  };

  const getReservationsForSlot = (slotId: string) => {
    const [startTime, endTime] = slotId.split("-");
    return fieldReservations.filter(r => r.startTime === startTime && r.endTime === endTime && (r.status === "approved" || r.status === "pending" || r.status === "pending_gold"));
  };

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded"></div></div>;
  if (!field) return <div className="text-center py-12"><h1 className="text-2xl font-bold">Field not found</h1><Link href="/fields"><Button className="mt-4">Back to Fields</Button></Link></div>;

  const activeZones = field.zones.filter((z) => z.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fields"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2"><h1 className="text-3xl font-bold">{field.name}</h1><Badge variant={field.isActive ? "default" : "secondary"}>{field.isActive ? "Open" : "Closed"}</Badge></div>
          <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" />{field.city.name}{field.address && ` • ${field.address}`}</p>
        </div>
      </div>

      {field.description && <Card><CardHeader><CardTitle className="text-lg">About this Field</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{field.description}</p></CardContent></Card>}

      {session && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
                <div><p className="font-medium">Notice an issue with this field?</p><p className="text-sm text-muted-foreground">Report problems like broken lights, safety hazards, etc.</p></div>
              </div>
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" onClick={() => setIssueDialogOpen(true)}>Report Issue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div><h2 className="text-xl font-semibold flex items-center gap-2"><Layers className="h-5 w-5" />Field Zones</h2><p className="text-muted-foreground">Click on a zone to book</p></div>
        {activeZones.length === 0 ? <Card className="p-12 text-center"><Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h2 className="text-xl font-semibold mb-2">No Zones Available</h2></Card> : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InteractiveSatelliteMap zones={field.zones} selectedZone={selectedZone} onZoneClick={(zone: Zone) => setSelectedZone(zone)} imageUrl={field.imageUrl} fieldName={field.name} />
              {selectedZone && <Card className="border-primary bg-primary/5"><CardContent className="pt-4"><div className="flex items-center justify-between"><p className="font-semibold">{selectedZone.name} selected</p><Button onClick={() => openReservationDialog(selectedZone)}><Calendar className="h-4 w-4 mr-2" />Book Now</Button></div></CardContent></Card>}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">All Available Zones</h3>
              {activeZones.map((zone) => <ZoneSelectionCard key={zone.id} zone={zone} isSelected={selectedZone?.id === zone.id} onClick={() => setSelectedZone(zone)} />)}
            </div>
          </div>
        )}
      </div>

      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report Field Issue</DialogTitle><DialogDescription>Let admins know about problems with {field.name}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Issue Type *</Label><select className="w-full border rounded-md p-2" value={issueData.issueType} onChange={(e) => setIssueData({ ...issueData, issueType: e.target.value })}><option value="">Select issue type</option><option value="lights">Lights not working</option><option value="safety">Safety hazard</option><option value="equipment">Broken equipment</option><option value="weather">Weather/Field conditions</option><option value="other">Other</option></select></div>
            <div className="space-y-2"><Label>Description *</Label><textarea className="w-full border rounded-md p-2 min-h-[100px]" value={issueData.description} onChange={(e) => setIssueData({ ...issueData, description: e.target.value })} placeholder="Describe the issue..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel</Button><Button onClick={submitFieldIssue} disabled={isSubmittingIssue || !issueData.issueType || !issueData.description.trim()} className="bg-orange-600 hover:bg-orange-700">{isSubmittingIssue ? "Submitting..." : "Submit Report"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Make a Reservation</DialogTitle><DialogDescription>Book {selectedZone?.name} at {field.name}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date (Mon-Fri only)</Label>
              <Input id="date" type="date" value={reservationData.date} onChange={(e) => { const d = e.target.value; if (d && !isDateAllowed(d)) { toast.error("Weekdays only"); return; } setReservationData({ ...reservationData, date: d, timeSlot: "" }); }} min={getMinDate()} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Time Slot</Label>{(isLoadingSlots || isLoadingFieldRes) && <span className="text-xs text-muted-foreground">Loading...</span>}</div>
              <div className="grid grid-cols-1 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot.id);
                  const isSelected = reservationData.timeSlot === slot.id;
                  const slotReservations = getReservationsForSlot(slot.id);
                  return (
                    <div key={slot.id} className="space-y-2">
                      <button type="button" disabled={isBooked || !reservationData.date} onClick={() => { if (!isBooked) setReservationData({ ...reservationData, timeSlot: slot.id }); }}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${isBooked ? "border-red-200 bg-red-50 cursor-not-allowed opacity-60" : isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/30" : !reservationData.date ? "border-border bg-muted/30 cursor-not-allowed" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isBooked ? "border-red-400 bg-red-400" : isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                              {isSelected && !isBooked && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                            <span className="font-medium">{slot.label}</span>
                          </div>
                          {isBooked ? <Badge variant="destructive">Booked</Badge> : <Badge variant="outline">Available</Badge>}
                        </div>
                      </button>
                      {/* Show who's in other zones during this time slot */}
                      {reservationData.date && slotReservations.length > 0 && (
                        <div className="ml-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1"><User className="h-3 w-3" />Coaches in other zones during this slot:</p>
                          <div className="space-y-1">
                            {slotReservations.map(res => (
                              <div key={res.id} className="text-xs text-blue-700 flex items-center justify-between">
                                <span><strong>{res.zone?.name}:</strong> {res.user?.name}{res.user?.teamName && ` (${res.user.teamName})`}</span>
                                <Badge variant="outline" className="text-[10px] h-5">{res.status === "approved" ? "Confirmed" : "Pending"}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notes (optional)</Label><textarea id="notes" className="w-full border rounded-md p-2" rows={2} value={reservationData.notes} onChange={(e) => setReservationData({ ...reservationData, notes: e.target.value })} placeholder="Any special requests..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleReservation} disabled={isSubmitting || !reservationData.date || !reservationData.timeSlot}>{isSubmitting ? "Submitting..." : "Request Reservation"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}