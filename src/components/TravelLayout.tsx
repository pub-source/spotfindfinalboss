import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MapPin, 
  Building2, 
  Menu, 
  X,
  Compass,
  User,
  LogOut,
  Coffee,
  Camera,
  Bus,
  ChevronDown,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TravelLayoutProps {
  children: React.ReactNode;
}

const exploreItems = [
  { name: "Tourist Spots", href: "/app/spots", icon: MapPin },
  { name: "Accommodations", href: "/app/accommodations", icon: Building2 },
  { name: "Cafe Shop", href: "/app/cafe", icon: Coffee },
  { name: "Gallery", href: "/app/gallery", icon: Camera },
  { name: "Transport Guide", href: "/app/transport", icon: Bus },
];

export function TravelLayout({ children }: TravelLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isGuest, isAdmin, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
  if (!loading && !isAuthenticated && !isGuest) {
    navigate('/login');
  }
}, [loading, isAuthenticated, isGuest, navigate]);

  useEffect(() => {
    if (user && isAuthenticated && !isGuest) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (data?.full_name) {
          setProfileName(data.full_name);
        }
      };

      fetchProfile();

      const channel = supabase
        .channel('profile-changes')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            if (payload.new && 'full_name' in payload.new) {
              setProfileName(payload.new.full_name as string);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAuthenticated, isGuest]);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r shadow-travel flex flex-col">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg bg-gradient-hero bg-clip-text text-transparent">
                TouristSpots
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="px-4 space-y-2 flex-1">
            <NavLink
              to="/app"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                isActive("/app")
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </NavLink>

            <Collapsible open={exploreOpen} onOpenChange={setExploreOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                    "text-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="h-5 w-5" />
                    Explore
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    exploreOpen && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-11 pt-1 space-y-1">
                {exploreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors",
                        isActive(item.href)
                          ? "text-primary font-medium bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {isAuthenticated && !isGuest && (
              <div className="px-3 py-2">
                <SettingsDropdown />
              </div>
            )}
          </nav>
          
          <div className="px-4 pb-4 mt-auto space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-ocean rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                  {isGuest && <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full"></span>}
                </div>
                <div className="text-sm">
                  <div className="font-medium truncate">
                    {isGuest ? 'Guest User' : profileName || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-muted-foreground text-xs truncate">
                    {isGuest ? 'Read-only access' : user?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isGuest ? () => navigate('/login') : handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isGuest ? <User className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <NavLink
              to="/app/feedback"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                isActive("/app/feedback")
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              Feedback Forum
            </NavLink>
          </div>
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r shadow-card">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg bg-gradient-hero bg-clip-text text-transparent">
                TouristSpots
              </span>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <NavLink
              to="/app"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                isActive("/app")
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </NavLink>

            <Collapsible open={exploreOpen} onOpenChange={setExploreOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                    "text-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="h-5 w-5" />
                    Explore
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    exploreOpen && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-11 pt-1 space-y-1">
                {exploreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors",
                        isActive(item.href)
                          ? "text-primary font-medium bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>

            {isAuthenticated && !isGuest && (
              <div className="px-3 py-2">
                <SettingsDropdown />
              </div>
            )}
          </nav>
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-8 w-8 bg-gradient-ocean rounded-full flex items-center justify-center relative">
                  <User className="h-4 w-4 text-white" />
                  {isGuest && <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full"></span>}
                </div>
                <div className="text-sm">
                  <div className="font-medium">
                    {isGuest ? 'Guest User' : profileName || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-muted-foreground">
                    {isGuest ? 'Read-only access' : user?.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isGuest ? () => navigate('/login') : handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isGuest ? <User className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <NavLink
              to="/app/feedback"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                isActive("/app/feedback")
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              Feedback Forum
            </NavLink>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="lg:hidden flex h-16 items-center gap-4 px-4 border-b bg-card/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <span className="font-bold bg-gradient-hero bg-clip-text text-transparent">
              Tourist Finder
            </span>
          </div>
        </div>

        <main className="min-h-screen bg-background scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}