"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Building, 
  Layers, 
  Users, 
  AlertTriangle,
  Settings,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Reservations", icon: Calendar },
  { href: "/admin/cities", label: "Cities", icon: MapPin },
  { href: "/admin/all-fields", label: "Fields", icon: Building },
  { href: "/admin/zones", label: "Zones", icon: Layers },
  { href: "/admin/users", label: "Members", icon: Users },
  { href: "/admin/issues", label: "Field Issues", icon: AlertTriangle },
  { href: "/admin/messages", label: "Send Message", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === "admin" || 
                  session?.user?.role === "silver_admin" || 
                  session?.user?.role === "gold_admin";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      toast.error("Access denied. Admin only.");
      router.push("/");
    }
  }, [session, status, router, isAdmin]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] -mx-4 -mt-6">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-yellow-400">Admin Panel</h2>
          <p className="text-xs text-gray-400">
            {session?.user?.role === "gold_admin" ? "Gold Admin" : 
             session?.user?.role === "silver_admin" ? "Silver Admin" : "Administrator"}
          </p>
        </div>
        <nav className="p-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || 
                           (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive 
                    ? "bg-yellow-500/20 text-yellow-400" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{link.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}