"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Building, Layers, Users, AlertTriangle, Clock, Check, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Stats {
  pendingReservations: number;
  todayReservations: number;
  totalCities: number;
  totalFields: number;
  totalZones: number;
  totalUsers: number;
  openIssues: number;
  recentReservations: Array<{
    id: string;
    date: string;
    status: string;
    user: { name: string };
    zone: { name: string; field: { name: string } };
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [reservationsRes, citiesRes, fieldsRes, zonesRes, usersRes, issuesRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/cities"),
        fetch("/api/fields"),
        fetch("/api/zones"),
        fetch("/api/users"),
        fetch("/api/field-issues?status=open"),
      ]);

      const [reservations, cities, fields, zones, users, issues] = await Promise.all([
        reservationsRes.json(),
        citiesRes.json(),
        fieldsRes.json(),
        zonesRes.json(),
        usersRes.json(),
        issuesRes.json(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const reservationsArray = Array.isArray(reservations) ? reservations : [];
      
      setStats({
        pendingReservations: reservationsArray.filter((r: any) => r.status === "pending" || r.status === "pending_gold").length,
        todayReservations: reservationsArray.filter((r: any) => r.date === today).length,
        totalCities: Array.isArray(cities) ? cities.length : 0,
        totalFields: Array.isArray(fields) ? fields.length : 0,
        totalZones: Array.isArray(zones) ? zones.length : 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        openIssues: Array.isArray(issues) ? issues.length : 0,
        recentReservations: reservationsArray.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: "Pending Approvals", 
      value: stats?.pendingReservations || 0, 
      icon: Clock, 
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      href: "/admin/reservations?status=pending"
    },
    { 
      label: "Today's Sessions", 
      value: stats?.todayReservations || 0, 
      icon: Calendar, 
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      href: "/admin/reservations"
    },
    { 
      label: "Open Issues", 
      value: stats?.openIssues || 0, 
      icon: AlertTriangle, 
      color: stats?.openIssues ? "text-red-500" : "text-green-500",
      bgColor: stats?.openIssues ? "bg-red-50" : "bg-green-50",
      href: "/admin/issues"
    },
    { 
      label: "Total Members", 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      href: "/admin/users"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/cities">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalCities}</p>
                  <p className="text-sm text-muted-foreground">Cities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/all-fields">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalFields}</p>
                  <p className="text-sm text-muted-foreground">Fields</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/zones">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalZones}</p>
                  <p className="text-sm text-muted-foreground">Zones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentReservations && stats.recentReservations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentReservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{res.user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {res.zone?.field?.name} - {res.zone?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      res.status === "approved" ? "default" :
                      res.status === "pending" ? "secondary" :
                      res.status === "pending_gold" ? "outline" :
                      "destructive"
                    }>
                      {res.status === "pending_gold" ? "Pending Final" : res.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{res.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent reservations</p>
          )}
          <Link href="/admin/reservations" className="block mt-4 text-center text-sm text-yellow-600 hover:underline">
            View all reservations →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}