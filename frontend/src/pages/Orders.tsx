import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, ExternalLink, LayoutGrid, List, FileText, Printer } from "lucide-react";
import { format } from "date-fns";

const Orders = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    orders, 
    getOrdersByUserId,
    generateReceipt,
    openReceipt
  } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);
  
  // Get user's orders
  const userOrders = user ? getOrdersByUserId(user.id.toString()) : [];
  
  // Filter orders based on search term
  const filteredOrders = userOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in order ID
    if (order.id.toLowerCase().includes(searchLower)) return true;
    
    // Search in medicine names
    if (order.items.some(item => item.name.toLowerCase().includes(searchLower))) return true;
    
    return false;
  });
  
  // Sort orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };
  
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="My Orders">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">My Orders</h2>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="flex items-center gap-1.5"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Card View</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center gap-1.5"
            >
              <List size={16} />
              <span className="hidden sm:inline">Table View</span>
            </Button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search orders by ID or medicine name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {sortedOrders.length > 0 ? (
          viewMode === "card" ? (
            <div className="space-y-6">
              {sortedOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className="overflow-hidden cursor-pointer hover:border-pharma-300 transition-colors"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                      <div>
                        <CardTitle className="text-lg">
                          <div className="flex items-center">
                            Order #{order.id}
                            <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-slate-400" />
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Placed on {format(order.orderDate, 'dd MMM yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
                          <div className="font-semibold">{formatCurrency(order.total)}</div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {order.completionDate && (
                      <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        Completed on {format(order.completionDate, 'dd MMM yyyy')}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReceipt(order.id);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Receipt</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateReceipt(order.id);
                      }}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => handleOrderClick(order.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          #{order.id}
                          <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-slate-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(order.orderDate, 'dd MMM yyyy')}
                        {order.completionDate && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Completed: {format(order.completionDate, 'dd MMM yyyy')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate">
                          {order.items.map(item => item.name).join(', ')}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {order.items.length} item(s)
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReceipt(order.id);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateReceipt(order.id);
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm ? "Try adjusting your search" : "You haven't placed any orders yet"}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Orders; 