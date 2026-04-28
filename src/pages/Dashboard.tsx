import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { LeoAIChatbot } from "@/components/LeoAIChatbot";
import { TouristSpotLeaderboard } from "@/components/TouristSpotLeaderboard";
import heroImage from "@/assets/hero-travel.jpg";

export default function Dashboard() {

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl shadow-float">
        <div 
          className="h-96 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
          <div className="relative h-full flex items-center px-8">
            <div className="text-white max-w-2xl">
              <h1 className="text-5xl font-bold mb-4">
                Discover Amazing 
                <span className="block bg-gradient-sunset bg-clip-text text-transparent">
                  Travel Destinations
                </span>
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Find the perfect spots and accommodations for your next adventure
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/spots">
                  <Button variant="hero" size="xl" className="gap-2">
                    <Navigation className="h-5 w-5" />
                    Explore Spots
                  </Button>
                </Link>
                <Link to="/accommodations">
                  <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Building2 className="h-5 w-5" />
                    Find Hotels
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TouristSpotLeaderboard />
        </div>

        <Card className="shadow-card h-fit">
          <CardHeader>
            <CardTitle>Map Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="ocean"
              className="w-full justify-start gap-2"
              onClick={() => window.open('https://earth.google.com/', '_blank')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Google Earth
            </Button>
            <Button
              variant="sunset"
              className="w-full justify-start gap-2"
              onClick={() => window.open('https://maps.google.com/', '_blank')}
            >
              <MapPin className="h-4 w-4" />
              Google Maps
            </Button>
            <Button
              variant="accent"
              className="w-full justify-start gap-2"
              onClick={() => window.open('https://waze.com/', '_blank')}
            >
              <Navigation className="h-4 w-4" />
              Waze
            </Button>
          </CardContent>
        </Card>
      </div>

      <LeoAIChatbot />
    </div>
  );
}