import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, Shield } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: MapPin,
      title: "Multiple Locations",
      description: "Browse fields across different cities and find the perfect location for your game.",
    },
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Book your preferred time slot with just a few clicks. No hassle, no phone calls.",
    },
    {
      icon: Users,
      title: "Zone Selection",
      description: "Choose from full field, half field, or specific zones based on your team size.",
    },
    {
      icon: Shield,
      title: "Secure Reservations",
      description: "Your reservations are confirmed by admins to ensure smooth operations.",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Book Your Perfect
          <span className="text-primary"> Soccer Field</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find and reserve soccer fields in your city. Easy scheduling, multiple
          zones, and instant booking confirmations.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/cities">
            <Button size="lg" className="text-lg px-8">
              Browse Fields
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Why Choose Us?</h2>
          <p className="text-muted-foreground">
            Everything you need to organize your soccer games
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardHeader>
                <feature.icon className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">
            Book your field in 3 simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="text-xl font-semibold">Choose a City</h3>
            <p className="text-muted-foreground">
              Browse through available cities and find fields near you.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="text-xl font-semibold">Select a Zone</h3>
            <p className="text-muted-foreground">
              Pick from full field, half field, or specific zones.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="text-xl font-semibold">Book Your Slot</h3>
            <p className="text-muted-foreground">
              Choose your date and time, and submit your reservation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to Play?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Create an account today and start booking soccer fields in your area.
          It&apos;s free to sign up!
        </p>
        <Link href="/register">
          <Button size="lg" className="text-lg px-8">
            Create Free Account
          </Button>
        </Link>
      </section>
    </div>
  );
}