"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Logged in successfully!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-50 via-white to-amber-50"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
      
      <Card className="w-full max-w-md border-0 shadow-2xl">
        {/* Gold accent bar */}
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
        <CardHeader className="space-y-1 pt-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/lasc.png" 
              alt="LASC Logo" 
              width={80} 
              height={80}
              className="drop-shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold shadow-lg shadow-yellow-500/20" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-yellow-600 hover:text-yellow-700 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}