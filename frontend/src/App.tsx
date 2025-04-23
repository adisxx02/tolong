import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MedicineProvider } from "@/contexts/MedicineContext";
import { OrderProvider } from "@/contexts/OrderContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MedicineList from "./pages/MedicineList";
import Users from "./pages/Users";
import MedicineData from "./pages/MedicineData";
import OrderData from "./pages/OrderData";
import OrderDetail from "./pages/OrderDetail";
import NotFound from "./pages/NotFound";
import UserHome from "./pages/UserHome";
import Cart from "./pages/Cart";
import UserOrders from "./pages/UserOrders";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MedicineProvider>
        <OrderProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/medicines" element={<MedicineList />} />
                <Route path="/users" element={<Users />} />
                <Route path="/medicine-data" element={<MedicineData />} />
                <Route path="/orders" element={<OrderData />} />
                <Route path="/order/:id" element={<OrderDetail />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/user-home" element={<UserHome />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/user-orders" element={<UserOrders />} />
                <Route path="/reports" element={<Reports />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </OrderProvider>
      </MedicineProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
