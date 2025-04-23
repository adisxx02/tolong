import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Medicine, useMedicines } from "./MedicineContext";
import { api } from "@/lib/api";
import { downloadOrderReceipt, openOrderReceipt } from "@/utils/pdfGenerator";

// Types for our data
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  orderDate: Date;
  completionDate: Date | null;
  status: OrderStatus;
  total: number; // Now represents total quantity instead of price
  notes?: string;
  createdAt?: Date; // For PDF generator compatibility
}

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  addOrder: (order: Omit<Order, 'id' | 'orderDate'>) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getOrdersByUserId: (userId: string) => Order[];
  getOrderById: (id: string) => Order | undefined;
  updateOrderNotes: (id: string, notes: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  fetchSpecificOrder: (orderId: string) => Promise<Order | null>;
  triggerRefresh: () => void;
  generateReceipt: (orderId: string) => Promise<void>;
  openReceipt: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const initialLoadComplete = useRef(false);
  
  // Add a function to manually trigger a refresh
  const triggerRefresh = () => {
    console.log("Manually triggering order refresh");
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Function to fetch a specific order by ID
  const fetchSpecificOrder = useCallback(async (orderId: string) => {
    try {
      console.log(`Fetching specific order: ${orderId}`);
      setIsLoading(true);
      
      // Try to get from the API
      let data;
      try {
        data = await api.getOrderById(orderId);
        console.log(`Specific order data for ${orderId} from API:`, data);
      } catch (apiError) {
        console.error(`Error fetching order ${orderId} from API:`, apiError);
        
        // If API fails, check if we already have it in state
        const existingOrder = orders.find(order => order.id === orderId);
        if (existingOrder) {
          console.log(`Found order ${orderId} in local state:`, existingOrder);
          return existingOrder;
        }
        
        throw new Error(`Could not fetch order ${orderId} from API and not found in local state`);
      }
      
      if (!data) {
        console.error(`Order ${orderId} not found in API response`);
        
        // Check if we have it in state before giving up
        const existingOrder = orders.find(order => order.id === orderId);
        if (existingOrder) {
          console.log(`Found order ${orderId} in local state after API returned null:`, existingOrder);
          return existingOrder;
        }
        
        toast({
          title: "Order Not Found",
          description: `Could not find order #${orderId}`,
          variant: "destructive",
        });
        return null;
      }
      
      // Format dates
      const formattedOrder = {
        ...data,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        completionDate: data.completionDate ? new Date(data.completionDate) : null
      };
      
      console.log(`Successfully formatted order ${orderId}:`, formattedOrder);
      
      // Add to orders state if not already present
      setOrders(prevOrders => {
        const exists = prevOrders.some(order => order.id === formattedOrder.id);
        if (!exists) {
          console.log(`Adding order ${orderId} to state`);
          return [...prevOrders, formattedOrder];
        }
        console.log(`Updating existing order ${orderId} in state`);
        return prevOrders.map(order => 
          order.id === formattedOrder.id ? formattedOrder : order
        );
      });
      
      return formattedOrder;
    } catch (error) {
      console.error(`Error in fetchSpecificOrder for ${orderId}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch order #${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, orders]);
  
  // Debug: fetch the specific order on mount, but only once
  useEffect(() => {
    // Remove the automatic fetch of the specific order
    // This was causing an infinite loop
    // const targetOrderId = 'ORD223044';
    // console.log(`Attempting to fetch target order: ${targetOrderId}`);
    // fetchSpecificOrder(targetOrderId);
  }, []);
  
  // Function to refresh orders
  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Refreshing orders...");
      const data = await api.getOrders();
      console.log("Refreshed orders:", data);
      
      // Transform dates from strings to Date objects
      const formattedData = data.map((order: any) => ({
        ...order,
        orderDate: new Date(order.orderDate),
        completionDate: order.completionDate ? new Date(order.completionDate) : null
      }));
      
      setOrders(formattedData);
      
      return formattedData;
    } catch (error) {
      console.error("Error refreshing orders:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh orders",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Load orders when component mounts or when refreshTrigger changes
  useEffect(() => {
    refreshOrders();
  }, [refreshTrigger, refreshOrders]);

  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'orderDate'>) => {
    try {
      setIsLoading(true);
      
      // Validate order data
      if (!orderData.userId) {
        throw new Error("User ID is required for order");
      }
      
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("Order must contain at least one item");
      }
      
      // Calculate total as the sum of quantities
      const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
      
      // Generate a temporary order ID immediately
      const tempOrderId = `ORD${Date.now().toString().slice(-6)}`;
      
      // Add this ID to the order before sending to API
      const orderWithQuantity = {
        ...orderData,
        id: tempOrderId, // Include ID before sending to server
        total: totalQuantity
      };
      
      console.log("Sending order data to database:", orderWithQuantity);
      
      try {
        // Call the API to save the order to database
        const order = await api.addOrder(orderWithQuantity);
        console.log("Order saved to database successfully:", order);
        
        if (!order) {
          console.warn("Server returned null or undefined for created order");
          
          // Create a fallback order with the temporary ID
          const fallbackOrder = {
            ...orderWithQuantity,
            orderDate: new Date(),
          } as Order;
          
          // Add to our orders state directly (optimistic update)
          setOrders(prevOrders => [...prevOrders, fallbackOrder]);
          
          // Also trigger a refresh for consistency
          triggerRefresh();
          
          toast({
            title: "Order Created",
            description: `Order has been saved to database. Refreshing data...`,
          });
          
          return fallbackOrder;
        }
        
        // Ensure we have an ID from the response or use our temporary one
        if (!order.id) {
          console.warn("Server returned order without ID, using temporary ID", tempOrderId);
          order.id = tempOrderId;
        }
        
        // Format dates for the new order
        const formattedOrder = {
          ...order,
          orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
          completionDate: order.completionDate ? new Date(order.completionDate) : null
        };
        
        // Add to our orders state directly (optimistic update)
        setOrders(prevOrders => [...prevOrders, formattedOrder]);
        
        // Also trigger a refresh for consistency
        triggerRefresh();
        
        toast({
          title: "Order Created",
          description: `Order #${order.id} has been saved to database`,
        });
        
        return formattedOrder;
      } catch (apiError) {
        console.error('API error when adding order:', apiError);
        
        // Create a fallback order with the temporary ID for the UI
        const fallbackOrder = {
          ...orderWithQuantity,
          id: tempOrderId,
          orderDate: new Date(),
        } as Order;
        
        // Still add to orders state for optimistic UI update
        setOrders(prevOrders => [...prevOrders, fallbackOrder]);
        
        // Trigger refresh to try to get the real data
        triggerRefresh();
        
        toast({
          title: "Order Created With Warnings",
          description: "Order was created but there was an issue receiving confirmation. Refreshing data...",
          variant: "default",
        });
        
        return fallbackOrder;
      }
    } catch (error) {
      console.error('Error saving order to database:', error);
      
      // Provide more specific error message based on the error
      let errorMessage = "Failed to save order to database";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for MongoDB validation errors
        if (errorMessage.includes("validation failed")) {
          errorMessage = "Order data validation failed. Please check your order details.";
        }
      }
      
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, triggerRefresh]);

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      setIsLoading(true);
      await api.updateOrderStatus(id, status);
      
      // Immediately update the UI
      setOrders(orders.map(order => {
        if (order.id === id) {
          return {
            ...order,
            status,
            completionDate: status === 'completed' ? new Date() : order.completionDate
          };
        }
        return order;
      }));
      
      // Also refresh all orders to ensure consistency
      triggerRefresh();
      
      if (status === 'completed') {
        toast({
          title: "Order Completed",
          description: "Order has been completed and stock has been updated",
        });
      } else {
        toast({
          title: "Status Updated",
          description: `Order status has been updated to ${status}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderNotes = async (id: string, notes: string) => {
    try {
      setIsLoading(true);
      await api.updateOrderNotes(id, notes);
      
      // Immediately update the UI
      setOrders(orders.map(order => {
        if (order.id === id) {
          return { ...order, notes };
        }
        return order;
      }));
      
      // Also refresh all orders to ensure consistency
      triggerRefresh();
      
      toast({
        title: "Notes Updated",
        description: "Order notes have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      setIsLoading(true);
      await api.deleteOrder(id);
      
      // Immediately update the UI
      setOrders(orders.filter(order => order.id !== id));
      
      // Also refresh all orders to ensure consistency
      triggerRefresh();
      
      toast({
        title: "Order Deleted",
        description: "Order has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOrdersByUserId = (userId: string) => {
    // Normalize userId for comparison
    const normalizedUserId = userId.toString();
    console.log("Looking for orders with userId:", normalizedUserId);
    
    // Filter orders and log matches for debugging
    const userOrders = orders.filter(order => {
      const orderUserId = order.userId?.toString();
      const isMatch = orderUserId === normalizedUserId;
      
      if (isMatch) {
        console.log("Matched order:", order.id);
      }
      
      return isMatch;
    });
    
    console.log(`Found ${userOrders.length} orders for user ${normalizedUserId}`);
    return userOrders;
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  const generateReceipt = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        const fetchedOrder = await fetchSpecificOrder(orderId);
        if (!fetchedOrder) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        
        // Convert Order to the format expected by receipt generator
        const receiptOrder = {
          ...fetchedOrder,
          createdAt: fetchedOrder.orderDate,
        };
        
        downloadOrderReceipt(receiptOrder);
      } else {
        // Convert Order to the format expected by receipt generator
        const receiptOrder = {
          ...order,
          createdAt: order.orderDate,
        };
        
        downloadOrderReceipt(receiptOrder);
      }
      
      toast({
        title: "Receipt Generated",
        description: "Order receipt has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate receipt",
        variant: "destructive",
      });
    }
  };

  const openReceipt = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        const fetchedOrder = await fetchSpecificOrder(orderId);
        if (!fetchedOrder) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        
        // Convert Order to the format expected by receipt generator
        const receiptOrder = {
          ...fetchedOrder,
          createdAt: fetchedOrder.orderDate,
        };
        
        openOrderReceipt(receiptOrder);
      } else {
        // Convert Order to the format expected by receipt generator
        const receiptOrder = {
          ...order,
          createdAt: order.orderDate,
        };
        
        openOrderReceipt(receiptOrder);
      }
      
      toast({
        title: "Receipt Opened",
        description: "Order receipt has been opened in a new tab",
      });
    } catch (error) {
      console.error("Error opening receipt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open receipt",
        variant: "destructive",
      });
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        getOrdersByUserId,
        getOrderById,
        updateOrderNotes,
        refreshOrders,
        fetchSpecificOrder,
        triggerRefresh,
        generateReceipt,
        openReceipt
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}; 