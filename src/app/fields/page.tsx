"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Layers, ArrowRight, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  imageUrl: string | null;
  isActive: boolean;
  city: City;
  zones: Zone[];
}

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/fields");
        const data = await response.json();
        setFields(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching fields:", error);
        setFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, []);

  const filteredFields = fields.filter(field => 
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.address?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Card key={i} className="animate-pulse border-0 shadow-lg overflow-hidden">
              <div className="h-40 bg-muted"></div>
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
              <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-yellow-400">All Fields</h1>
              <p className="text-gray-300">Browse and book available soccer fields</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search fields, locations..." 
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
          {fields.filter(f => f.isActive).length} Open Fields
        </div>
        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
          {fields.reduce((acc, f) => acc + f.zones.filter(z => z.isActive).length, 0)} Available Zones
        </div>
      </div>

      {filteredFields.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-lg">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {searchQuery ? "No Matching Fields" : "No Fields Available"}
          </h2>
          <p className="text-muted-foreground">
            {searchQuery 
              ? "Try adjusting your search query" 
              : "Check back later for available fields."}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => (
            <Link key={field.id} href={`/fields/${field.id}`}>
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                {/* Field Image */}
                <div className="relative h-44 bg-gradient-to-br from-yellow-100 to-amber-100 overflow-hidden">
                  {field.imageUrl ? (
                    <Image
                      src={field.imageUrl}
                      alt={field.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="h-16 w-16 text-yellow-300 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="2" y="2" width="20" height="20" rx="2"/>
                          <line x1="12" y1="2" x2="12" y2="22"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge 
                      className={field.isActive 
                        ? "bg-yellow-500 hover:bg-yellow-500 text-black shadow-lg" 
                        : "bg-gray-500 hover:bg-gray-500 text-white shadow-lg"}
                    >
                      {field.isActive ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Open</>
                      ) : "Closed"}
                    </Badge>
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg group-hover:text-yellow-600 transition-colors line-clamp-1">
                    {field.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">{field.city.name}{field.address ? ` • ${field.address}` : ""}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {field.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {field.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      <Layers className="h-3 w-3 mr-1" />
                      {field.zones.filter(z => z.isActive).length} zone{field.zones.filter(z => z.isActive).length !== 1 ? "s" : ""}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground group-hover:text-yellow-600 transition-colors">
                      Book Now
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