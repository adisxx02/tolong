import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders, Order } from "@/contexts/OrderContext";
import { Search, ShoppingCart, Package, ExternalLink, RefreshCw, LayoutGrid, List, FileText, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import React from "react";

const UserOrders = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    orders, 
    isLoading: ordersLoading, 
    getOrdersByUserId, 
    triggerRefresh, 
    refreshOrders,
    generateReceipt,
    openReceipt
  } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Target specific order for debugging
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [targetOrderError, setTargetOrderError] = useState<string | null>(null);
  
  // Force a refresh when the component mounts
  useEffect(() => {
    const loadData = async () => {
      console.log("UserOrders: Component mounted, refreshing orders");
      setIsRefreshing(true);
      try {
        await refreshOrders();
        console.log("UserOrders: Orders refreshed successfully");
      } catch (error) {
        console.error("UserOrders: Error refreshing orders:", error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    loadData();
  }, [refreshOrders]);
  
  // Fetch target order for debugging
  const fetchTargetOrder = async () => {
    if (!user) return;
    
    const orderId = "ORD223044"; // Specific order ID for debugging
    setTargetOrderError(null);
    
    try {
      console.log(`Fetching specific order: ${orderId}`);
      
      const fetchedOrder = await api.getOrderById(orderId);
      console.log("Fetched order:", fetchedOrder);
      
      if (fetchedOrder) {
        // Format dates
        const formattedOrder = {
          ...fetchedOrder,
          orderDate: new Date(fetchedOrder.orderDate),
          completionDate: fetchedOrder.completionDate ? new Date(fetchedOrder.completionDate) : null
        };
        
        setTargetOrder(formattedOrder as Order);
      } else {
        setTargetOrderError(`Could not find order ${orderId}`);
      }
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      setTargetOrderError(error instanceof Error ? error.message : String(error));
    }
  };
  
  // Get user's orders when user changes or orders are updated
  useEffect(() => {
    if (user && !ordersLoading) {
      const userOrders = getOrdersByUserId(user.id);
      console.log(`Found ${userOrders.length} orders for user ${user.id}`);
    }
  }, [user, orders, ordersLoading, getOrdersByUserId]);
  
  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
      toast({
        title: "Orders Refreshed",
        description: "Your orders have been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Get user orders and filter by search term if provided
  const userOrders = user ? getOrdersByUserId(user.id) : [];
  const filteredOrders = userOrders.filter(order => 
    searchTerm ? 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    : true
  );
  
  // Sort orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200">{status}</Badge>;
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="My Orders">
      <div className="animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">My Orders</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Card</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-none"
              >
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
            >
              {isRefreshing ? (
                <div className="h-4 w-4 border-2 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden xs:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate("/cart")}
              size="sm"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden xs:inline">Cart</span>
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search orders by ID or status..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {sortedOrders.length > 0 ? (
          viewMode === "card" ? (
            <div className="grid grid-cols-1 gap-4">
              {sortedOrders.map(order => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex flex-wrap items-center gap-2">
                          <span className="text-lg">Order #{order.id}</span>
                          {getStatusBadge(order.status)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Placed on {format(new Date(order.orderDate), 'MMMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">{item.quantity} units</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <span className="text-sm text-slate-500">Total Items:</span>
                      <span className="font-semibold">{order.total} units</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 flex items-center gap-1"
                      onClick={() => openReceipt(order.id)}
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Receipt</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 flex items-center gap-1"
                      onClick={() => generateReceipt(order.id)}
                    >
                      <Printer className="h-4 w-4" />
                      <span>Download Receipt</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate text-sm">
                            {order.items.map(item => item.name).join(", ")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.items.length} items
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{order.total} units</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReceipt(order.id)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Receipt</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateReceipt(order.id)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="mb-4 text-slate-400">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              No orders found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {searchTerm ? "Try adjusting your search" : "You haven't placed any orders yet"}
            </p>
            
            <Button 
              onClick={() => navigate("/cart")}
              className="bg-pharma-600 hover:bg-pharma-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Go to Cart
            </Button>
          </div>
        )}
        
        {/* Debug area for specific order */}
        {targetOrder && (
          <div className="mt-8 p-4 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold mb-2">Debug: Specific Order</h3>
            <pre className="text-xs overflow-auto p-2 bg-white border rounded">
              {JSON.stringify(targetOrder, null, 2)}
            </pre>
          </div>
        )}
        
        {targetOrderError && (
          <div className="mt-8 p-4 border rounded-lg bg-red-50">
            <h3 className="text-lg font-semibold mb-2">Error Fetching Order</h3>
            <p className="text-red-600">{targetOrderError}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserOrders; 