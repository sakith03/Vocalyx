import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ChatBot from "./pages/ChatBot";
import Analytics from "./pages/Analytics";
import AnalyticsSimple from "./pages/AnalyticsSimple";
import GoalDetail from "./pages/GoalDetail";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import WorkspaceSetup from "./pages/WorkspaceSetup";
import Settings from "./pages/Settings";
import PasswordTest from "./pages/PasswordTest";
import CallHistory from "./pages/CallHistory";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-background">{children}</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/workspace-setup"
                element={
                  <ProtectedRoute>
                    <WorkspaceSetup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPermission="Dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:orderId"
                element={
                  <ProtectedRoute>
                    <ChatBot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/call-history"
                element={
                  <ProtectedRoute requiredPermission="Contacts">
                    <CallHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredPermission="Settings">
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/password-test" element={<PasswordTest />} />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredPermission="Analytics">
                    <AnalyticsSimple />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals/:id"
                element={
                  <ProtectedRoute>
                    <GoalDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sentiment-analysis"
                element={
                  <ProtectedRoute requiredPermission="Sentiment">
                    <SentimentAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
