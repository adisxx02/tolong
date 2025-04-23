import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicines } from "@/contexts/MedicineContext";
import { useOrders, OrderStatus } from "@/contexts/OrderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PillIcon, ShoppingCart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const { medicines, refreshMedicines } = useMedicines();
  const { orders, refreshOrders } = useOrders();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Refresh data when component mounts and every 30 seconds
  useEffect(() => {
    const loadInitialData = async () => {
      await refreshDashboardData();
    };
    
    loadInitialData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshDashboardData(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "superadmin")) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);
  
  const refreshDashboardData = async (showToast = true) => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshMedicines(), refreshOrders()]);
      if (showToast) {
        toast({
          title: "Dashboard Updated",
          description: "The dashboard data has been refreshed.",
        });
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter orders by status
  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  };
  
  // Get low stock medicines (less than 10 units)
  const getLowStockMedicines = () => {
    return medicines
      .filter(medicine => medicine.stock < 10)
      .sort((a, b) => a.stock - b.stock);
  };
  
  // Get recent orders (last 3)
  const getRecentOrders = () => {
    return [...orders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 3);
  };
  
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="Dashboard">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Welcome back, {user.username}</h2>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => refreshDashboardData()}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <div className="h-4 w-4 border-2 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isRefreshing ? "Refreshing..." : "Refresh Dashboard"}</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{medicines.length}</div>
                <div className="w-12 h-12 bg-pharma-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <PillIcon className="h-6 w-6 text-pharma-600 dark:text-pharma-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{getOrdersByStatus('pending').length}</div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRecentOrders().length > 0 ? (
                  getRecentOrders().map(order => (
                    <div key={order.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {order.items.length} items - {format(new Date(order.orderDate), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <Badge className={`
                          ${order.status === 'completed' ? 'bg-green-500' : ''}
                          ${order.status === 'pending' ? 'bg-amber-500' : ''}
                          ${order.status === 'processing' ? 'bg-blue-500' : ''}
                          ${order.status === 'cancelled' ? 'bg-red-500' : ''}
                        `}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <p>No recent orders to display</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Low Stock Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getLowStockMedicines().length > 0 ? (
                  getLowStockMedicines().slice(0, 3).map(medicine => (
                    <div key={medicine.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{medicine.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{medicine.category}</p>
                        </div>
                        <Badge variant="outline" className={`
                          ${medicine.stock < 5 ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : ''}
                          ${medicine.stock >= 5 && medicine.stock < 10 ? 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800' : ''}
                        `}>
                          {medicine.stock} left
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <p>No low stock medicines</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
