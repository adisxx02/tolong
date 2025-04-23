import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders, Order, OrderStatus } from "@/contexts/OrderContext";
import { useMedicines } from "@/contexts/MedicineContext";
import { Search, RefreshCw, Filter, Check, FilePenLine, Trash2, Package, FileText, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

// Define a type for user data 
interface UserData {
  _id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

const OrderData = () => {
  const { user, isAdmin } = useAuth();
  const { orders, isLoading, updateOrderStatus, deleteOrder, updateOrderNotes, refreshOrders, triggerRefresh, openReceipt, generateReceipt } = useOrders();
  const { refreshMedicines } = useMedicines();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>("pending");
  const [orderNotes, setOrderNotes] = useState("");
  const [statusChangeNotes, setStatusChangeNotes] = useState("");
  const [usersData, setUsersData] = useState<Record<string, UserData>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Force a refresh when the component mounts to ensure we have the latest data
  useEffect(() => {
    console.log("OrderData: Component mounted, refreshing orders");
    const loadInitialData = async () => {
      setIsRefreshing(true);
      try {
        await refreshOrders();
        console.log("OrderData: Initial order data loaded");
      } catch (error) {
        console.error("Error loading initial order data:", error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    loadInitialData();
  }, [refreshOrders]);
  
  // Fetch user data for all orders
  useEffect(() => {
    const fetchUsersData = async () => {
      if (!orders.length) return;
      
      // Create a Set of unique user IDs from all orders
      const userIds = new Set(orders.map(order => order.userId));
      
      // Convert Set to Array and filter out any undefined/null values
      const uniqueUserIds = Array.from(userIds).filter(Boolean);
      
      // Store temporary user data
      const userData: Record<string, UserData> = {};
      
      // Fetch user data for each unique user ID
      for (const userId of uniqueUserIds) {
        try {
          const userInfo = await api.getUserById(userId);
          if (userInfo) {
            userData[userId] = userInfo;
          }
        } catch (error) {
          console.error(`Error fetching user data for ID ${userId}:`, error);
        }
      }
      
      setUsersData(userData);
    };
    
    fetchUsersData();
  }, [orders]);
  
  // Redirect non-admins
  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate]);
  
  // Filter orders based on search term and active tab
  const filteredOrders = orders.filter(order => {
    // Apply tab filter
    if (activeTab !== "all" && order.status !== activeTab) {
      return false;
    }
    
    // Apply search term filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchTermLower) ||
        order.userName.toLowerCase().includes(searchTermLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTermLower))
      );
    }
    
    return true;
  });
  
  // Sort orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
  
  // Helper function to get user's full name
  const getUserFullName = (userId: string): string => {
    if (!userId || !usersData[userId]) return "Unknown";
    return usersData[userId].name || "No name";
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both orders and medicines
      await Promise.all([refreshOrders(), refreshMedicines()]);
      toast({
        title: "Data Refreshed",
        description: "Orders and inventory have been refreshed from the database.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const confirmStatusChange = async () => {
    if (!selectedOrder) return;
    
    // Track if stock might be affected
    const willAffectStock = 
      newOrderStatus === 'completed' || 
      (selectedOrder.status === 'completed' && newOrderStatus === 'cancelled');
    
    try {
      await updateOrderStatus(selectedOrder.id, newOrderStatus);
      
      // If there are status change notes, update the order notes as well
      if (statusChangeNotes.trim()) {
        const currentDate = new Date();
        const formattedDate = format(currentDate, 'dd MMM yyyy HH:mm');
        const statusNote = `[${formattedDate}] Status changed to ${newOrderStatus}: ${statusChangeNotes}`;
        
        // Combine existing notes with the new status note
        const updatedNotes = selectedOrder.notes 
          ? `${selectedOrder.notes}\n\n${statusNote}`
          : statusNote;
          
        await updateOrderNotes(selectedOrder.id, updatedNotes);
      }
      
      // If stock was affected, refresh medicines to show updated stock levels
      if (willAffectStock) {
        await refreshMedicines();
      }
      
      toast({
        title: "Status Updated",
        description: `Order ${selectedOrder.id} status changed to ${newOrderStatus}`,
      });
      setIsStatusDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      });
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedOrder) return;
    
    try {
      await deleteOrder(selectedOrder.id);
      toast({
        title: "Order Deleted",
        description: `Order ${selectedOrder.id} has been deleted`,
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      });
    }
  };
  
  const confirmUpdateNotes = async () => {
    if (!selectedOrder) return;
    
    try {
      await updateOrderNotes(selectedOrder.id, orderNotes);
      toast({
        title: "Notes Updated",
        description: `Notes for order ${selectedOrder.id} have been updated`,
      });
      setIsNotesDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update order notes",
        variant: "destructive",
      });
    }
  };
  
  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.status);
    setStatusChangeNotes(""); // Reset status change notes
    setIsStatusDialogOpen(true);
  };
  
  const openDeleteDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };
  
  const openNotesDialog = (order: Order) => {
    setSelectedOrder(order);
    setOrderNotes(order.notes || "");
    setIsNotesDialogOpen(true);
  };
  
  const viewOrderDetails = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    }
  };
  
  // Show loading state while authentication or order data is loading
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If user is not an admin, don't show the component
  if (!isAdmin) {
    return (
      <MainLayout title="Access Denied">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-4">You don't have permission to view this page</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Order Management">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Orders Management</h2>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <div className="h-4 w-4 border-2 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isRefreshing ? "Refreshing..." : "Refresh Orders"}</span>
          </Button>
        </div>
        
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search orders by ID, customer, or medicine..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {sortedOrders.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell>{getUserFullName(order.userId)}</TableCell>
                    <TableCell>{format(new Date(order.orderDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {order.items.length} items
                      <span className="text-xs text-slate-500 block">
                        Total: {order.total} units
                      </span>
                    </TableCell>
                    <TableCell>{renderStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewOrderDetails(order.id)}
                          title="View Details"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReceipt(order.id);
                          }}
                          title="View Receipt"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="More Actions">
                              <Filter className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openStatusDialog(order)}>
                              <Check className="mr-2 h-4 w-4" />
                              <span>Update Status</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openNotesDialog(order)}>
                              <FilePenLine className="mr-2 h-4 w-4" />
                              <span>Edit Notes</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateReceipt(order.id)}>
                              <Printer className="mr-2 h-4 w-4" />
                              <span>Download Receipt</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(order)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Order</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="mb-4 text-slate-400">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              No orders found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm ? "Try a different search term" : activeTab !== "all" ? "No orders with this status" : "There are no orders in the system yet"}
            </p>
          </div>
        )}
        
        {/* Status Change Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Change the status for order {selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={newOrderStatus === 'pending' ? 'default' : 'outline'}
                  className={newOrderStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                  onClick={() => setNewOrderStatus('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={newOrderStatus === 'processing' ? 'default' : 'outline'}
                  className={newOrderStatus === 'processing' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  onClick={() => setNewOrderStatus('processing')}
                >
                  Processing
                </Button>
                <Button
                  variant={newOrderStatus === 'completed' ? 'default' : 'outline'}
                  className={newOrderStatus === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setNewOrderStatus('completed')}
                >
                  Completed
                </Button>
                <Button
                  variant={newOrderStatus === 'cancelled' ? 'default' : 'outline'}
                  className={newOrderStatus === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : ''}
                  onClick={() => setNewOrderStatus('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
              
              <div className="mt-4">
                <label htmlFor="status-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes about this status change
                </label>
                <Textarea
                  id="status-notes"
                  placeholder="Enter any notes about why you're changing the status (optional)"
                  value={statusChangeNotes}
                  onChange={(e) => setStatusChangeNotes(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              
              {newOrderStatus === 'completed' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm">
                  <p>Note: Completing this order will reduce the stock of the items in the order.</p>
                </div>
              )}
              
              {newOrderStatus === 'cancelled' && selectedOrder?.status === 'completed' && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md text-sm">
                  <p>Warning: Cancelling a completed order will restore the stock of the items in the order.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmStatusChange}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete order {selectedOrder?.id}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Notes Edit Dialog */}
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Order Notes</DialogTitle>
              <DialogDescription>
                Update notes for order {selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Enter notes for this order"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmUpdateNotes}>
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

// Helper for Search icon
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default OrderData; 