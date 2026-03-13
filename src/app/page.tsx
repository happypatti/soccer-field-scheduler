import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
          {/* Soccer field pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.3"/>
            <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.3"/>
          </svg>
        </div>
        
        <div className="text-center space-y-8 py-16 md:py-24">
          {/* Logo */}
          <div className="flex justify-center">
            <Image 
              src="/lasc.png" 
              alt="LASC Logo" 
              width={180} 
              height={180}
              className="drop-shadow-xl"
              priority
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/cities">
              <Button size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25">
                View Fields
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/reservations">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2">
                My Reservations
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="space-y-12 bg-gradient-to-b from-white to-green-50/50 -mx-4 px-4 py-16 rounded-3xl">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground">
            Book your field in 3 simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="relative text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-green-500/30">
              1
            </div>
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-green-300 to-transparent"></div>
            <h3 className="text-xl font-bold pt-2">Choose a Location</h3>
            <p className="text-muted-foreground">
              Browse available fields and select your preferred location.
            </p>
          </div>
          <div className="relative text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
              2
            </div>
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-emerald-300 to-transparent"></div>
            <h3 className="text-xl font-bold pt-2">Select Your Zone</h3>
            <p className="text-muted-foreground">
              Click on the interactive map to choose your field zone.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-xl shadow-teal-500/30">
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
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 md:p-16 text-center space-y-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <h2 className="text-3xl md:text-4xl font-bold text-white relative">Ready to Book?</h2>
        <p className="text-green-100 max-w-xl mx-auto text-lg relative">
          Start scheduling your field time now. Quick, easy, and efficient.
        </p>
        <Link href="/cities">
          <Button size="lg" className="text-lg px-10 h-14 bg-white text-green-700 hover:bg-green-50 shadow-xl relative">
            Browse Available Fields
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
