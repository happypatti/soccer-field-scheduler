"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Layers } from "lucide-react";

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
  zones: Zone[];
}

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  fields: Field[];
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

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Available Fields</h2>
        <p className="text-muted-foreground">
          Select a field to view available zones and make a reservation
        </p>
      </div>

      {city.fields.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Fields Available</h2>
          <p className="text-muted-foreground">
            No fields have been added to this city yet.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {city.fields.map((field) => (
            <Link key={field.id} href={`/fields/${field.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{field.name}</CardTitle>
                      {field.address && (
                        <CardDescription className="mt-1">
                          {field.address}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={field.isActive ? "default" : "secondary"}>
                      {field.isActive ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {field.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {field.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {field.zones.filter(z => z.isActive).length} zone{field.zones.filter(z => z.isActive).length !== 1 ? "s" : ""} available
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}