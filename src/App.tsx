import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { hapticWelcome, isHapticsEnabled, isWelcomeHapticsEnabled } from "./utils/haptics";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const goOffline = () => toast.info("You're offline — game works locally, leaderboard & duels need Wi-Fi.");
    const goOnline  = () => toast.success("Back online 🏀");
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  // Welcome vibration — fires on every fresh app open (sessionStorage clears when PWA is closed)
  useEffect(() => {
    if (sessionStorage.getItem('sg_welcomed')) return;
    sessionStorage.setItem('sg_welcomed', '1');

    if (!('vibrate' in navigator)) return;
    if (!isHapticsEnabled() || !isWelcomeHapticsEnabled()) return;

    // Small delay so the browser has fully activated before vibrating
    const t = setTimeout(hapticWelcome, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
