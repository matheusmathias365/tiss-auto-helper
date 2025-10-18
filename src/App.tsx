import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfilesDashboard from "./pages/ProfilesDashboard";
import ProfilesManagement from "./pages/ProfilesManagement";
import ConvenioPanel from "./pages/ConvenioPanel";
import ModeSelection from "./pages/ModeSelection";
import ManualMode from "./pages/ManualMode";
import AutomaticMode from "./pages/AutomaticMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProfilesDashboard />} />
          <Route path="/profiles-management" element={<ProfilesManagement />} />
          <Route path="/convenio/:profileId" element={<ConvenioPanel />} />
          <Route path="/mode-selection" element={<ModeSelection />} />
          <Route path="/manual" element={<ManualMode />} />
          <Route path="/automatic" element={<AutomaticMode />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
