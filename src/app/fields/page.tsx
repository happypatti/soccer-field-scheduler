"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Layers } from "lucide-react";

interface City {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
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

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/fields");
        const data = await response.json();
        setFields(data);
      } catch (error) {
        console.error("Error fetching fields:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">All Fields</h1>
          <p className="text-muted-foreground">
            Browse all available soccer fields
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">All Fields</h1>
        <p className="text-muted-foreground">
          Browse all available soccer fields
        </p>
      </div>

      {fields.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Fields Available</h2>
          <p className="text-muted-foreground">
            Check back later for available fields.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <Link key={field.id} href={`/fields/${field.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{field.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {field.city.name}
                      </CardDescription>
                    </div>
                    <Badge variant={field.isActive ? "default" : "secondary"}>
                      {field.isActive ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {field.address && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {field.address}
                    </p>
                  )}
                  {field.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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