import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicines, Medicine } from "@/contexts/MedicineContext";
import { useOrders, OrderStatus, Order } from "@/contexts/OrderContext";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, ShoppingCart, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

const Cart = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOrder, triggerRefresh } = useOrders();
  const { medicines } = useMedicines();
  const [cart, setCart] = useState<Array<{medicine: Medicine, quantity: number}>>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("tambakaji_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Verify medicine IDs are still valid
        const validCart = parsedCart.filter((item: any) => 
          medicines.some(m => m.id === item.medicine.id)
        );
        setCart(validCart);
      } catch (error) {
        console.error("Failed to parse cart:", error);
      }
    }
  }, [medicines]);
  
  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("tambakaji_cart", JSON.stringify(cart));
  }, [cart]);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);
  
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
  };
  
  const handleRemoveFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
    
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };
  
  const handlePlaceOrder = () => {
    if (cart.length === 0 || !user) return;
    
    // Get updated medicine data
    const cartWithCurrentData = cart.map(item => {
      const currentMedicine = medicines.find(m => m.id === item.medicine.id);
      return {
        ...item,
        medicine: currentMedicine || item.medicine
      };
    });
    
    // Check for out of stock items
    const outOfStockItems = cartWithCurrentData.filter(item => 
      item.medicine.stock < item.quantity
    );
    
    if (outOfStockItems.length > 0) {
      toast({
        title: "Out of Stock",
        description: `Some items in your cart are out of stock or have insufficient quantity`,
        variant: "destructive",
      });
      return;
    }
    
    setIsConfirmDialogOpen(true);
  };
  
  const confirmOrder = async () => {
    if (cart.length === 0 || !user) return;
    
    // Reset states
    setErrorMessage(null);
    setIsProcessing(true);
    
    // Show processing message
    toast({
      title: "Processing Order",
      description: "Connecting to database server...",
    });
    
    try {
      // Verify server connection before proceeding
      try {
        // Simple health check
        await fetch('/api');
      } catch (connectError) {
        console.error("Failed to connect to server:", connectError);
        setErrorMessage("Cannot connect to the database server. Please check if the server is running.");
        setIsProcessing(false);
        
        toast({
          title: "Server Connection Error",
          description: "Cannot connect to the database server. Please check if the server is running.",
          variant: "destructive",
        });
        return; // Exit early
      }
      
      // Get the user ID safely without type errors
      const userId = user.id;
      
      // Check if user ID exists
      if (!userId) {
        console.error("User ID is undefined or null:", user);
        setErrorMessage("User information is incomplete. Please try logging in again.");
        setIsProcessing(false);
        
        toast({
          title: "Order Failed",
          description: "User information is incomplete. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Generate order ID for display purposes (actual ID will be generated on server)
      const tempOrderId = `ORD${Date.now().toString().slice(-6)}`;
      setCreatedOrderId(tempOrderId);
      
      // Calculate total quantity
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
      
      // Create order items with timestamps to ensure uniqueness
      const orderItems = cart.map((item, index) => ({
        id: `OI${Date.now().toString().slice(-6)}_${index}`,
        medicineId: item.medicine.id,
        name: item.medicine.name,
        quantity: item.quantity,
        price: 0 // Setting price to 0 as we're not tracking prices
      }));
      
      console.log("Creating order with userId:", userId);
      console.log("Order items:", orderItems);
      
      // Create the order data object to send to backend
      const orderData = {
        userId: String(userId),
        userName: user.username,
        items: orderItems,
        completionDate: null,
        status: 'pending' as OrderStatus,
        total: totalQuantity, // Using total quantity instead of price
        notes: '' // Add empty notes to match schema
      };
      
      // Update toast message
      toast({
        title: "Processing Order",
        description: "Saving order data to database...",
      });
      
      // Save order to database
      console.log("Sending order to database:", orderData);
      
      // Call addOrder from OrderContext - now has improved error handling
      const result = await addOrder(orderData);
      console.log("Order creation result:", result);
      
      if (result) {
        // Use the order ID from the result (which might be a temporary ID if server response was incomplete)
        setCreatedOrderId(result.id);
        
        // Clear the cart
        setCart([]);
        localStorage.removeItem("tambakaji_cart");
        
        // Trigger a refresh to ensure all order views are updated
        triggerRefresh();
        
        setIsConfirmDialogOpen(false);
        setIsProcessing(false);
        
        // Show success message
        toast({
          title: "Order Saved Successfully",
          description: `Your order #${result.id} has been saved to the database`,
        });
        
        // Short delay to ensure state updates complete
        setTimeout(() => {
          setIsOrderSuccessOpen(true);
        }, 300);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Error saving order to database:", error);
      
      // Handle specific error cases
      let errorMsg = "Failed to save order to database";
      if (error instanceof Error) {
        errorMsg = error.message;
        // Special handling for specific error cases
        if (errorMsg.includes("connect")) {
          errorMsg = "Cannot connect to the database server. Please make sure the server is running.";
        } else if (errorMsg.includes("network")) {
          errorMsg = "Network error. Please check your internet connection.";
        } else if (errorMsg.includes("empty response")) {
          errorMsg = "Server is not responding properly. Please try again later.";
        }
      }
      
      setErrorMessage(errorMsg);
      setIsProcessing(false);
      
      // Show error message
      toast({
        title: "Database Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };
  
  // Calculate total quantity instead of subtotal
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="My Cart">
      <div className="animate-fade-in">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-semibold">My Cart</h2>
          
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate("/medicines")}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Continue Shopping</span>
              <span className="inline sm:hidden">Shop</span>
            </Button>
          </div>
        </div>
        
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead className="text-center w-[140px]">Quantity</TableHead>
                        <TableHead className="text-right w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => (
                        <TableRow key={`${item.medicine.id}-${index}`}>
                          <TableCell className="font-medium">{item.medicine.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <div className="h-8 px-2 md:px-3 flex items-center justify-center border-y border-input">
                                {item.quantity}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleRemoveFromCart(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Items</span>
                      <span>{cart.length} items</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total Quantity</span>
                      <span>{totalItems} units</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-pharma-600 hover:bg-pharma-700"
                    onClick={handlePlaceOrder}
                  >
                    Place Order
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="mb-4 text-slate-400">
              <ShoppingCart className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your cart is empty
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add some medicines to your cart
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/medicines")}
              className="mt-2"
            >
              Browse Medicines
            </Button>
          </div>
        )}
      </div>
      
      {/* Order Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={(open) => !isProcessing && setIsConfirmDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorMessage ? "Error" : "Confirm Order"}</DialogTitle>
            {!errorMessage && <DialogDescription>
              Are you sure you want to place this order?
            </DialogDescription>}
          </DialogHeader>
          {errorMessage ? (
            <div className="py-4">
              <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md mb-4">
                <p className="font-semibold">Error:</p>
                <p>{errorMessage}</p>
              </div>
              <p className="text-sm text-slate-500">Please try again or contact support if the problem persists.</p>
            </div>
          ) : (
            <div className="py-4">
              <p className="font-semibold">Total Items: {cart.length} medicines ({totalItems} units)</p>
              <p className="text-sm text-slate-500 mt-1">Once your order is placed, it will be reviewed by staff.</p>
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm text-slate-700 dark:text-slate-300">
                <p>Note: Your order will need to be confirmed by staff. Stock will be reserved for you, but will not be reduced from inventory until your order is marked as completed.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                disabled={isProcessing}
              >
                {errorMessage ? "Close" : "Cancel"}
              </Button>
            </DialogClose>
            {!errorMessage && (
              <Button 
                onClick={confirmOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : "Confirm Order"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Order Success Dialog */}
      <Dialog open={isOrderSuccessOpen} onOpenChange={setIsOrderSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Saved to Database</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            {createdOrderId ? (
              <>
                <p className="text-center font-semibold mb-2">
                  Order #{createdOrderId}
                </p>
                <p className="text-center">
                  Your order has been successfully saved to the database. You can track your order in the Orders page.
                </p>
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-sm">
                  <p>Your order data has been stored in the database and is now available in the system.</p>
                </div>
              </>
            ) : (
              <p className="text-center">
                Your order has been placed successfully. You can track your order in the Orders page.
              </p>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOrderSuccessOpen(false);
              }}
            >
              Close
            </Button>
            <Button 
              className="bg-pharma-600 hover:bg-pharma-700"
              onClick={() => {
                setIsOrderSuccessOpen(false);
                // Force a refresh before navigation to ensure latest data
                triggerRefresh();
                // Add a small delay to allow refresh to complete
                setTimeout(() => {
                  navigate("/user-orders");
                }, 100);
              }}
            >
              View My Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Cart; 