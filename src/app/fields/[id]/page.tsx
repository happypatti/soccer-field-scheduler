"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Users, DollarSign, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  pricePerHour: number | null;
  isActive: boolean;
}

interface Field {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  isActive: boolean;
  city: City;
  zones: Zone[];
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
  const [reservationData, setReservationData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchField = async () => {
      try {
        const response = await fetch(`/api/fields/${params.id}`);
        const data = await response.json();
        setField(data);
      } catch (error) {
        console.error("Error fetching field:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchField();
    }
  }, [params.id]);

  const handleReservation = async () => {
    if (!session) {
      toast.error("Please sign in to make a reservation");
      router.push("/login");
      return;
    }

    if (!selectedZone || !reservationData.date || !reservationData.startTime || !reservationData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zoneId: selectedZone.id,
          date: reservationData.date,
          startTime: reservationData.startTime,
          endTime: reservationData.endTime,
          notes: reservationData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create reservation");
        return;
      }

      toast.success("Reservation submitted successfully! Awaiting admin approval.");
      setIsDialogOpen(false);
      setReservationData({ date: "", startTime: "", endTime: "", notes: "" });
      router.push("/reservations");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReservationDialog = (zone: Zone) => {
    if (!session) {
      toast.error("Please sign in to make a reservation");
      router.push("/login");
      return;
    }
    setSelectedZone(zone);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Field not found</h1>
        <Link href="/fields">
          <Button className="mt-4">Back to Fields</Button>
        </Link>
      </div>
    );
  }

  const activeZones = field.zones.filter((z) => z.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fields">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{field.name}</h1>
            <Badge variant={field.isActive ? "default" : "secondary"}>
              {field.isActive ? "Open" : "Closed"}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {field.city.name}
            {field.address && ` • ${field.address}`}
          </p>
        </div>
      </div>

      {field.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About this Field</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{field.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Available Zones</h2>
          <p className="text-muted-foreground">
            Select a zone to make a reservation
          </p>
        </div>

        {activeZones.length === 0 ? (
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No Zones Available</h2>
            <p className="text-muted-foreground">
              All zones are currently unavailable.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeZones.map((zone) => (
              <Card key={zone.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{zone.name}</CardTitle>
                  {zone.description && (
                    <CardDescription>{zone.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    {zone.capacity && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Up to {zone.capacity} players</span>
                      </div>
                    )}
                    {zone.pricePerHour && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>${(zone.pricePerHour / 100).toFixed(2)}/hour</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => openReservationDialog(zone)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book This Zone
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Reservation</DialogTitle>
            <DialogDescription>
              Book {selectedZone?.name} at {field.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={reservationData.date}
                onChange={(e) =>
                  setReservationData({ ...reservationData, date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={reservationData.startTime}
                  onChange={(e) =>
                    setReservationData({
                      ...reservationData,
                      startTime: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={reservationData.endTime}
                  onChange={(e) =>
                    setReservationData({
                      ...reservationData,
                      endTime: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Any special requests or notes..."
                value={reservationData.notes}
                onChange={(e) =>
                  setReservationData({ ...reservationData, notes: e.target.value })
                }
              />
            </div>
            {selectedZone?.pricePerHour && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Price: ${(selectedZone.pricePerHour / 100).toFixed(2)} per hour
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReservation} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}