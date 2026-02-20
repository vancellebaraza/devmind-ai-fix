import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import SharePage from "./pages/SharePage";
import ProfilePage from "./pages/ProfilePage";
import ScanPage from "./pages/ScanPage";
import DnaPage from "./pages/DnaPage";
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
            {/* Public only (redirect to dashboard if logged in) */}
            <Route path="/" element={<PublicOnlyRoute><Index /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><AuthPage mode="signup" /></PublicOnlyRoute>} />

            {/* Public share page - no auth required */}
            <Route path="/share/:id" element={<SharePage />} />

            {/* Protected routes */}
            <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
            <Route path="/dna" element={<ProtectedRoute><DnaPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

