import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section with Soccer Background */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center justify-center -mt-6">
        {/* Soccer field background image (subtle) */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' fill='none'%3E%3Crect width='1200' height='800' fill='%23228B22'/%3E%3Crect x='50' y='50' width='1100' height='700' stroke='white' stroke-width='4' fill='none'/%3E%3Cline x1='600' y1='50' x2='600' y2='750' stroke='white' stroke-width='3'/%3E%3Ccircle cx='600' cy='400' r='91.5' stroke='white' stroke-width='3' fill='none'/%3E%3Ccircle cx='600' cy='400' r='5' fill='white'/%3E%3Crect x='50' y='275' width='165' height='250' stroke='white' stroke-width='3' fill='none'/%3E%3Crect x='50' y='325' width='55' height='150' stroke='white' stroke-width='3' fill='none'/%3E%3Carc cx='215' cy='400' r='91.5' stroke='white' stroke-width='3' fill='none'/%3E%3Crect x='985' y='275' width='165' height='250' stroke='white' stroke-width='3' fill='none'/%3E%3Crect x='1095' y='325' width='55' height='150' stroke='white' stroke-width='3' fill='none'/%3E%3Ccircle cx='120' cy='400' r='3' fill='white'/%3E%3Ccircle cx='1080' cy='400' r='3' fill='white'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-yellow-50/80 via-white/60 to-amber-50/80"></div>
        
        {/* Decorative blurs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-400/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        
        <div className="text-center space-y-8 py-16 md:py-24 relative z-10">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/50 blur-2xl rounded-full scale-150"></div>
              <Image 
                src="/lasc.png" 
                alt="LASC Logo" 
                width={200} 
                height={200}
                className="drop-shadow-2xl relative"
                priority
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Field Scheduling
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Book training sessions now
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/cities">
              <Button size="lg" className="text-lg px-8 h-14 shadow-lg shadow-primary/25">
                View Fields
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/reservations">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 bg-white/80 hover:bg-white">
                My Reservations
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="space-y-12 bg-gradient-to-b from-white to-amber-50/50 -mx-4 px-4 py-16 rounded-3xl">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            Book your field in 3 simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="relative text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/30">
              1
            </div>
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
            <h3 className="text-xl font-bold pt-2">Choose a Location</h3>
            <p className="text-muted-foreground">
              Browse available fields and select your preferred location.
            </p>
          </div>
          <div className="relative text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-800 to-black text-yellow-400 text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-black/30">
              2
            </div>
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-gray-400/50 to-transparent"></div>
            <h3 className="text-xl font-bold pt-2">Select Your Zone</h3>
            <p className="text-muted-foreground">
              Click on the interactive map to choose your field zone.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-600 text-black text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
              3
            </div>
            <h3 className="text-xl font-bold pt-2">Confirm Booking</h3>
            <p className="text-muted-foreground">
              Pick your date and time, then submit your reservation.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-3xl p-8 md:p-16 text-center space-y-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 relative">Ready to Book?</h2>
        <p className="text-gray-300 max-w-xl mx-auto text-lg relative">
          Start scheduling your field time now. Quick, easy, and efficient.
        </p>
        <Link href="/cities">
          <Button size="lg" className="text-lg px-10 h-14 bg-yellow-400 text-black hover:bg-yellow-300 shadow-xl relative">
            Browse Available Fields
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}