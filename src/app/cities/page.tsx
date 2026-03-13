"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface City {
  id: string;
  name: string;
  state: string | null;
  country: string;
  fields?: { id: string }[];
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities");
        const data = await response.json();
        // Ensure we have an array
        if (Array.isArray(data)) {
          setCities(data);
        } else {
          console.error("Expected array, got:", data);
          setCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-black p-8 md:p-12">
          <div className="relative z-10">
            <div className="h-10 w-48 bg-white/20 rounded animate-pulse mb-4"></div>
            <div className="h-6 w-64 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-lg">
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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-black to-gray-900 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-400/20 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-yellow-400">Locations</h1>
              <p className="text-gray-300">Select a city to view available fields</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search locations..." 
              className="pl-12 h-12 bg-white/95 border-0 shadow-lg text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium">
          {cities.length} Location{cities.length !== 1 ? 's' : ''}
        </div>
        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
          {cities.reduce((acc, city) => acc + (city.fields?.length || 0), 0)} Total Fields
        </div>
      </div>

      {filteredCities.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-lg">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? "No Matching Locations" : "No Locations Available"}
          </h2>
          <p className="text-muted-foreground">
            {searchQuery 
              ? "Try adjusting your search query" 
              : "Check back later for available locations."}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCities.map((city) => (
            <Link key={city.id} href={`/cities/${city.id}`}>
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <MapPin className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-yellow-600 transition-colors">
                          {city.name}
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                          {city.state ? `${city.state}, ` : ""}{city.country}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Building className="h-3 w-3 mr-1" />
                        {city.fields?.length || 0} field{(city.fields?.length || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground group-hover:text-yellow-600 transition-colors">
                      View Fields
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
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
