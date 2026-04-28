import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bus, Car, Bike, MapPin, Clock, DollarSign, Users, Navigation } from "lucide-react";

export default function TransportGuide() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [selectedTransport, setSelectedTransport] = useState("all");
  const [results, setResults] = useState<any[]>([]);

  const transportModes = [
    { id: "jeepney", name: "Jeepney", icon: Bus, baseFare: 13, perKm: 5, capacity: "16-22", color: "bg-yellow-500" },
    { id: "tricycle", name: "Tricycle", icon: Bike, baseFare: 15, perKm: 5, capacity: "3-4", color: "bg-blue-500" },
    { id: "private_van", name: "Private Van", icon: Car, baseFare: 200, perKm: 5, capacity: "8-12", color: "bg-green-500" },
    { id: "motorcycle", name: "Motorcycle", icon: Bike, baseFare: 30, perKm: 5, capacity: "1-2", color: "bg-red-500" },
  ];

  const popularRoutes = [
  { from: "Sta. Rosa", to: "Calamba", distance: 12.5 },
  { from: "Biñan", to: "Sta. Rosa", distance: 6.2 },
  { from: "Cabuyao", to: "Sta. Rosa", distance: 8.1 },
  { from: "Los Baños", to: "Calamba", distance: 10.4 },
  { from: "San Pedro", to: "Biñan", distance: 9.0 },
  { from: "Calamba", to: "Los Baños", distance: 10.5 },
  { from: "Calamba", to: "Cabuyao", distance: 11.2 },
  { from: "Sta. Cruz", to: "Pagsanjan", distance: 4.7 },
  { from: "Pagsanjan", to: "Lumban", distance: 6.8 },
  { from: "Nagcarlan", to: "Liliw", distance: 5.2 },
  { from: "Majayjay", to: "Liliw", distance: 7.9 },
  { from: "Sta. Cruz", to: "Nagcarlan", distance: 12.6 },
  { from: "San Pablo", to: "Nagcarlan", distance: 10.9 },
  { from: "San Pablo", to: "Alaminos", distance: 8.4 },
  { from: "Paete", to: "Siniloan", distance: 14.7 },
  { from: "Famy", to: "Mabitac", distance: 11.3 },
  { from: "Kalayaan", to: "Sta. Cruz", distance: 7.2 },
  { from: "Cavinti", to: "Pagsanjan", distance: 9.5 },
  { from: "Luisiana", to: "Majayjay", distance: 13.8 },
  { from: "Sta. Maria", to: "Mabitac", distance: 10.1 },
];


  const calculateFare = (transport: any, distance: number) => {
    if (transport.id === "bicycle") return { fare: 0, time: Math.round(distance * 4) }; // 15 km/h average
    
    const fare = transport.baseFare + (distance * transport.perKm);
    let time = 0;
    
    switch (transport.id) {
      case "jeepney": time = Math.round(distance * 3); break; // 20 km/h average
      case "tricycle": time = Math.round(distance * 2.5); break; // 24 km/h average  
      case "private_van": time = Math.round(distance * 1.8); break; // 33 km/h average
      case "motorcycle": time = Math.round(distance * 2); break; // 30 km/h average
    }
    
    return { fare: Math.round(fare), time };
  };

  const calculateRoute = () => {
    if (!fromLocation || !toLocation) return;
    
    // Simulate distance calculation (in real app, use mapping API)
    const mockDistance = Math.random() * 20 + 5; // 5-25 km
    
    const filteredTransports = selectedTransport === "all" 
      ? transportModes 
      : transportModes.filter(t => t.id === selectedTransport);
    
    const routeResults = filteredTransports.map(transport => {
      const { fare, time } = calculateFare(transport, mockDistance);
      return {
        ...transport,
        distance: mockDistance.toFixed(1),
        fare,
        estimatedTime: time,
        from: fromLocation,
        to: toLocation
      };
    });
    
    setResults(routeResults);
  };

  const usePopularRoute = (route: any) => {
    setFromLocation(route.from);
    setToLocation(route.to);
    
    const filteredTransports = selectedTransport === "all" 
      ? transportModes 
      : transportModes.filter(t => t.id === selectedTransport);
    
    const routeResults = filteredTransports.map(transport => {
      const { fare, time } = calculateFare(transport, route.distance);
      return {
        ...transport,
        distance: route.distance.toFixed(1),
        fare,
        estimatedTime: time,
        from: route.from,
        to: route.to
      };
    });
    
    setResults(routeResults);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Transport Guide
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Plan your journey with fare estimates and travel times for different transport modes
          </p>
        </div>

        {/* Route Calculator */}
        <Card className="mb-8 shadow-travel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Plan Your Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Input
                  placeholder="Enter starting location"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Input
                  placeholder="Enter destination"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Select value={selectedTransport} onValueChange={setSelectedTransport}>
                <SelectTrigger className="md:w-64">
                  <SelectValue placeholder="Transport Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transport Modes</SelectItem>
                  {transportModes.map((transport) => (
                    <SelectItem key={transport.id} value={transport.id}>
                      {transport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={calculateRoute}
                className="hover:shadow-glow transition-all duration-200"
                disabled={!fromLocation || !toLocation}
              >
                Calculate Route
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="max-h-96 overflow-y-auto pr-2">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {popularRoutes.map((route, index) => (
      <Card 
        key={index} 
        className="cursor-pointer hover:shadow-travel transition-all duration-200 hover:-translate-y-1" 
        onClick={() => usePopularRoute(route)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{route.from}</p>
              <p className="text-xs text-muted-foreground">to</p>
              <p className="font-medium text-sm">{route.to}</p>
            </div>
            <Badge variant="secondary">{route.distance} km</Badge>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</div>


        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Route Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <Card key={index} className="hover:shadow-travel transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${result.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{result.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Capacity: {result.capacity} passengers
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{result.distance} km distance</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{result.estimatedTime} minutes</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {result.fare === 0 ? "Free" : `₱${result.fare}`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground mb-2">
                          Route: {result.from} → {result.to}
                        </div>
                        <Button className="w-full hover:shadow-glow transition-all">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Transport Mode Info */}
        {results.length === 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Available Transport Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transportModes.map((transport, index) => {
                const Icon = transport.icon;
                return (
                  <Card key={transport.id} className="hover:shadow-travel transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${transport.color} text-white`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{transport.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Capacity: {transport.capacity}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Fare:</span>
                          <span className="font-medium">
                            {transport.baseFare === 0 ? "Free" : `₱${transport.baseFare}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Per km:</span>
                          <span className="font-medium">
                            {transport.perKm === 0 ? "Free" : `₱${transport.perKm}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}