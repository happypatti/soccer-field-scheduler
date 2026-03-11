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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Users, DollarSign, Calendar, Layers } from "lucide-react";
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
  imageUrl: string | null;
  isActive: boolean;
  city: City;
  zones: Zone[];
}

// Interactive satellite map component with zone overlays
function InteractiveSatelliteMap({ 
  zones, 
  selectedZone, 
  onZoneClick,
  imageUrl,
  fieldName
}: { 
  zones: Zone[]; 
  selectedZone: Zone | null;
  onZoneClick: (zone: Zone) => void;
  imageUrl?: string | null;
  fieldName: string;
}) {
  const activeZones = zones.filter(z => z.isActive);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  
  // Zone positions for John Muir North Practice Field (based on the satellite image)
  // 3 fields: Field A (top-left), Field B (bottom-left), Field C (bottom-right)
  const getZonePosition = (zoneName: string, index: number, total: number) => {
    // Custom positions mapped to the actual satellite image of John Muir field
    const zonePositions: Record<string, { left: string; top: string; width: string; height: string }> = {
      // Field A - Top-left corner
      'Field A': { left: '5%', top: '5%', width: '40%', height: '40%' },
      // Field B - Bottom-left corner  
      'Field B': { left: '5%', top: '55%', width: '40%', height: '40%' },
      // Field C - Bottom-right corner (same size as Field B)
      'Field C': { left: '55%', top: '55%', width: '40%', height: '40%' },
    };
    
    if (zonePositions[zoneName]) {
      return zonePositions[zoneName];
    }
    
    // Default layout for 3 fields: top-left, bottom-left, bottom-right
    if (total === 1) {
      return { left: '5%', top: '5%', width: '40%', height: '40%' };
    }
    if (total === 2) {
      return index === 0
        ? { left: '5%', top: '5%', width: '40%', height: '40%' }
        : { left: '5%', top: '55%', width: '40%', height: '40%' };
    }
    if (total === 3) {
      // Top-left, bottom-left, bottom-right
      if (index === 0) return { left: '5%', top: '5%', width: '40%', height: '40%' };      // Field A - Top-left
      if (index === 1) return { left: '5%', top: '55%', width: '40%', height: '40%' };     // Field B - Bottom-left
      return { left: '55%', top: '55%', width: '40%', height: '40%' };                      // Field C - Bottom-right
    }
    // 4 quadrants fallback
    if (index === 0) return { left: '5%', top: '5%', width: '42%', height: '42%' };
    if (index === 1) return { left: '53%', top: '5%', width: '42%', height: '42%' };
    if (index === 2) return { left: '5%', top: '53%', width: '42%', height: '42%' };
    return { left: '53%', top: '53%', width: '42%', height: '42%' };
  };

  // Default satellite image or uploaded one
  const backgroundImage = imageUrl || '/fields/john_muir.png';
  
  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-border shadow-lg bg-gray-100">
        {/* Satellite Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Fallback gradient if image doesn't load */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-700/20 to-green-900/20"></div>
        </div>
        
        {/* Clickable Zone overlays */}
        {activeZones.map((zone, index) => {
          const position = getZonePosition(zone.name, index, activeZones.length);
          const isSelected = selectedZone?.id === zone.id;
          const isHovered = hoveredZone === zone.id;
          
          return (
            <button
              key={zone.id}
              onClick={() => onZoneClick(zone)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className={`absolute transition-all duration-300 rounded-lg flex flex-col items-center justify-center
                ${isSelected 
                  ? 'bg-blue-500/60 border-4 border-blue-400 ring-4 ring-blue-400/50 shadow-lg shadow-blue-500/30' 
                  : isHovered
                    ? 'bg-green-500/50 border-3 border-green-300 shadow-lg shadow-green-500/30'
                    : 'bg-white/20 border-2 border-white/70 hover:bg-white/30'
                }`}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                height: position.height,
              }}
            >
              {/* Zone label */}
              <div className={`px-3 py-2 rounded-lg backdrop-blur-sm transition-all
                ${isSelected ? 'bg-blue-900/80' : 'bg-black/60'}`}
              >
                <span className="text-white font-bold text-sm drop-shadow-lg block">
                  {zone.name}
                </span>
                {zone.capacity && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Users className="h-3 w-3 text-white/80" />
                    <span className="text-white/80 text-xs">{zone.capacity} players</span>
                  </div>
                )}
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
        
        {/* Map pin marker */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></div>
          <span className="text-xs font-medium text-gray-700">{fieldName}</span>
        </div>
        
        {/* Legend/Instructions */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-white/90 text-xs text-center">
              📍 Click on a zone to select it for booking
            </p>
          </div>
        </div>
      </div>
      
      {/* Zone Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-white/30 border border-white/70"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/50 border border-green-300"></div>
          <span>Hover</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500/60 border-2 border-blue-400"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

// Zone selection card
function ZoneSelectionCard({ 
  zone, 
  isSelected, 
  onClick 
}: { 
  zone: Zone; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200
        ${isSelected 
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
            ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
          >
            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
          </div>
          <div>
            <p className="font-semibold">{zone.name}</p>
            {zone.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{zone.description}</p>
            )}
          </div>
        </div>
        <Badge variant={zone.isActive ? "default" : "secondary"}>
          {zone.isActive ? "Available" : "Unavailable"}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground ml-6">
        {zone.capacity && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{zone.capacity} players</span>
          </div>
        )}
        {zone.pricePerHour && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>${(zone.pricePerHour / 100).toFixed(2)}/hr</span>
          </div>
        )}
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

      {/* Interactive Field Visualization */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Field Zones
          </h2>
          <p className="text-muted-foreground">
            Click on a zone in the field diagram or select from the list below to book
          </p>
        </div>

        {activeZones.length === 0 ? (
          <Card className="p-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Zones Available</h2>
            <p className="text-muted-foreground">
              All zones are currently unavailable.
            </p>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Visual Field Representation */}
            <div className="space-y-4">
              <InteractiveSatelliteMap 
                zones={field.zones} 
                selectedZone={selectedZone}
                onZoneClick={(zone: Zone) => {
                  setSelectedZone(zone);
                }}
                imageUrl={field.imageUrl}
                fieldName={field.name}
              />
              
              {/* Selected zone action */}
              {selectedZone && (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedZone.name} selected</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {selectedZone.capacity && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {selectedZone.capacity} players
                            </span>
                          )}
                          {selectedZone.pricePerHour && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${(selectedZone.pricePerHour / 100).toFixed(2)}/hr
                            </span>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => openReservationDialog(selectedZone)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Zone List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">All Available Zones</h3>
              {activeZones.map((zone) => (
                <ZoneSelectionCard
                  key={zone.id}
                  zone={zone}
                  isSelected={selectedZone?.id === zone.id}
                  onClick={() => setSelectedZone(zone)}
                />
              ))}
              
              {/* Quick book button for mobile */}
              {selectedZone && (
                <Button 
                  className="w-full lg:hidden mt-4" 
                  size="lg"
                  onClick={() => openReservationDialog(selectedZone)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book {selectedZone.name}
                </Button>
              )}
            </div>
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