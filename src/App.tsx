import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { hapticWelcome, isHapticsEnabled, isWelcomeHapticsEnabled } from "./utils/haptics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const goOffline = () => toast.warning("You're offline — reconnect to play today's challenge.");
    window.addEventListener('offline', goOffline);
    return () => window.removeEventListener('offline', goOffline);
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
  );
};

export default App;
