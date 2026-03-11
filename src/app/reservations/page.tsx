"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { toast } from "sonner";

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
  zone: Zone;
  createdAt: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  denied: "destructive",
  cancelled: "outline",
};

export default function ReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchReservations = async () => {
      try {
        const response = await fetch("/api/reservations");
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchReservations();
    }
  }, [session, status, router]);

  const cancelReservation = async (id: string) => {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to cancel reservation");
        return;
      }

      toast.success("Reservation cancelled");
      setReservations(
        reservations.map((r) =>
          r.id === id ? { ...r, status: "cancelled" } : r
        )
      );
    } catch {
      toast.error("Something went wrong");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
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
        <h1 className="text-3xl font-bold">My Reservations</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded"></div>
                <div className="h-4 w-32 bg-muted rounded mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingReservations = reservations.filter((r) => r.status === "pending");
  const approvedReservations = reservations.filter((r) => r.status === "approved");
  const pastReservations = reservations.filter(
    (r) => r.status === "denied" || r.status === "cancelled"
  );

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{reservation.zone.name}</CardTitle>
            <CardDescription>
              {reservation.zone.field.name} • {reservation.zone.field.city.name}
            </CardDescription>
          </div>
          <Badge variant={statusColors[reservation.status]}>
            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(reservation.date)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
            </span>
          </div>
        </div>
        {reservation.notes && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Your notes:</span> {reservation.notes}
          </p>
        )}
        {reservation.adminNotes && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Admin notes:</span> {reservation.adminNotes}
          </p>
        )}
        {reservation.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => cancelReservation(reservation.id)}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel Reservation
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Reservations</h1>
        <p className="text-muted-foreground">
          View and manage your field reservations
        </p>
      </div>

      {reservations.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Reservations Yet</h2>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t made any reservations yet.
          </p>
          <Button onClick={() => router.push("/fields")}>Browse Fields</Button>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedReservations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingReservations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending reservations</p>
              </Card>
            ) : (
              pendingReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedReservations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No approved reservations</p>
              </Card>
            ) : (
              approvedReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastReservations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No past reservations</p>
              </Card>
            ) : (
              pastReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}