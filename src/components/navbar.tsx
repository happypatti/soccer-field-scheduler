"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, MapPin, CalendarDays, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === "admin";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/cities", label: "Locations" },
    { href: "/fields", label: "Fields" },
  ];

  const authLinks = session
    ? [
        { href: "/reservations", label: "My Bookings" },
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [];

  const isActivePath = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image 
              src="/lasc.png" 
              alt="LASC Logo" 
              width={44} 
              height={44}
              className="drop-shadow-md group-hover:drop-shadow-lg transition-all"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                LASC
              </span>
              <span className="block text-[10px] text-muted-foreground -mt-1 tracking-wider uppercase">
                Field Scheduler
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath(link.href)
                    ? "bg-green-100 text-green-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {authLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath(link.href)
                    ? "bg-green-100 text-green-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <Avatar className="h-8 w-8 border-2 border-green-200">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin ? "Administrator" : "Member"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10 border-2 border-green-200">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-semibold">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => router.push("/reservations")}
                    className="cursor-pointer rounded-lg"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem 
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer rounded-lg"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-muted-foreground">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActivePath(link.href)
                    ? "bg-green-100 text-green-700"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label === "Locations" && <MapPin className="h-5 w-5" />}
                {link.label === "Fields" && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>}
                {link.label === "Home" && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
                {link.label}
              </Link>
            ))}
            {authLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActivePath(link.href)
                    ? "bg-green-100 text-green-700"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label === "My Bookings" && <CalendarDays className="h-5 w-5" />}
                {link.label === "Admin" && <LayoutDashboard className="h-5 w-5" />}
                {link.label}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t">
              {session ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar className="h-10 w-10 border-2 border-green-200">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 px-4">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
