import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TravelLayout } from "@/components/TravelLayout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import TouristSpots from "./pages/NewTouristSpots";
import Accommodations from "./pages/NewAccommodations";
import CafeShop from "./pages/NewCafeShop";
import Gallery from "./pages/NewGallery";
import TransportGuide from "./pages/TransportGuide";
import UserProfile from "./pages/UserProfile";
import FeedbackForum from "./pages/FeedbackForum";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/app/*" element={
              <TravelLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/spots" element={<TouristSpots />} />
                  <Route path="/accommodations" element={<Accommodations />} />
                  <Route path="/cafe" element={<CafeShop />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/transport" element={<TransportGuide />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/feedback" element={<FeedbackForum />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TravelLayout>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
