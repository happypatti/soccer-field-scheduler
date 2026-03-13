"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Layers, Users, DollarSign, ChevronRight } from "lucide-react";

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
  zones?: Zone[];
}

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  fields?: Field[];
}

// Soccer field visual component
function SoccerFieldVisual({ zones = [], fieldName }: { zones: Zone[]; fieldName: string }) {
  const activeZones = zones.filter(z => z.isActive);
  
  return (
    <div className="relative w-full aspect-[2/1] bg-gradient-to-b from-green-500 to-green-600 rounded-lg overflow-hidden border-4 border-white shadow-inner">
      {/* Field markings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Center circle */}
        <div className="w-16 h-16 border-2 border-white/60 rounded-full"></div>
        <div className="absolute w-2 h-2 bg-white/60 rounded-full"></div>
      </div>
      
      {/* Center line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/60"></div>
      
      {/* Left penalty area */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1/6 border-2 border-white/60 border-l-0"></div>
      <div className="absolute left-0 top-[35%] bottom-[35%] w-[8%] border-2 border-white/60 border-l-0"></div>
      
      {/* Right penalty area */}
      <div className="absolute right-0 top-1/4 bottom-1/4 w-1/6 border-2 border-white/60 border-r-0"></div>
      <div className="absolute right-0 top-[35%] bottom-[35%] w-[8%] border-2 border-white/60 border-r-0"></div>
      
      {/* Corner arcs */}
      <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/60 rounded-br-full"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/60 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/60 rounded-tr-full"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/60 rounded-tl-full"></div>
      
      {/* Zone labels */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/90 text-center px-4">
          <p className="font-bold text-lg drop-shadow">{fieldName}</p>
          <p className="text-sm drop-shadow">
            {activeZones.length} zone{activeZones.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </div>
  );
}

// Zone card component
function ZoneCard({ zone }: { zone: Zone }) {
  return (
    <div className={`p-3 rounded-lg border ${zone.isActive ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-gray-100 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${zone.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="font-medium text-sm">{zone.name}</span>
        </div>
        <Badge variant={zone.isActive ? "default" : "secondary"} className="text-xs">
          {zone.isActive ? "Available" : "Unavailable"}
        </Badge>
      </div>
    </div>
  );
}

export default function CityDetailPage() {
  const params = useParams();
  const [city, setCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCity = async () => {
      try {
        const response = await fetch(`/api/cities/${params.id}`);
        const data = await response.json();
        setCity(data);
      } catch (error) {
        console.error("Error fetching city:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCity();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">City not found</h1>
        <Link href="/cities">
          <Button className="mt-4">Back to Cities</Button>
        </Link>
      </div>
    );
  }

  const fields = city.fields || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cities">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            {city.name}
          </h1>
          <p className="text-muted-foreground">
            {city.state ? `${city.state}, ` : ""}{city.country}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{fields.length}</div>
              <div className="text-sm text-muted-foreground">Total Fields</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {fields.filter(f => f.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Open Fields</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {fields.reduce((acc, f) => acc + (f.zones?.filter(z => z.isActive).length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Available Zones</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Soccer Fields</h2>
        <p className="text-muted-foreground">
          Select a field to view details and make a reservation
        </p>
      </div>

      {fields.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Fields Available</h2>
          <p className="text-muted-foreground">
            No fields have been added to this city yet.
          </p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {fields.map((field) => {
            const fieldZones = field.zones || [];
            const activeZones = fieldZones.filter(z => z.isActive);
            
            return (
              <Card key={field.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {field.name}
                        <Badge variant={field.isActive ? "default" : "secondary"} className="ml-2">
                          {field.isActive ? "Open" : "Closed"}
                        </Badge>
                      </CardTitle>
                      {field.address && (
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {field.address}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Visual soccer field representation */}
                  <SoccerFieldVisual zones={fieldZones} fieldName={field.name} />
                  
                  {field.description && (
                    <p className="text-sm text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                  
                  {/* Zone list */}
                  {fieldZones.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Zones ({activeZones.length} available)
                      </h4>
                      <div className="grid gap-2">
                        {fieldZones.slice(0, 3).map((zone) => (
                          <ZoneCard key={zone.id} zone={zone} />
                        ))}
                        {fieldZones.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{fieldZones.length - 3} more zones
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Link href={`/fields/${field.id}`} className="block">
                    <Button className="w-full" variant={field.isActive ? "default" : "secondary"}>
                      View Field Details
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
