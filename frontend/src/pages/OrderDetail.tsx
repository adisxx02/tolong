import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders, Order, OrderStatus } from "@/contexts/OrderContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { getOrderById, updateOrderNotes } = useOrders();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isNotesEdited, setIsNotesEdited] = useState(false);

  // Navigate back to the orders list
  const navigateToOrdersList = () => {
    if (isAdmin) {
      // Admin goes to orders management page
      navigate("/orders");
    } else {
      // Regular user goes to their orders page
      navigate("/user-orders");
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
      return;
    }

    if (id) {
      const orderData = getOrderById(id);
      if (orderData) {
        setOrder(orderData);
        setNotes(orderData.notes || "");
      } else {
        // Order not found, redirect to orders page
        navigateToOrdersList();
      }
    }
  }, [id, user, isLoading, navigate, getOrderById]);

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500";
      default:
        return "";
    }
  };

  const handleSaveNotes = () => {
    if (order) {
      updateOrderNotes(order.id, notes);
      setIsNotesEdited(false);
      toast({
        title: "Notes Saved",
        description: "Order notes have been updated successfully",
      });
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsNotesEdited(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <MainLayout title="Order Details">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Button 
            variant="outline" 
            onClick={navigateToOrdersList}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Order ${order.id}`}>
      <div className="animate-fade-in">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={navigateToOrdersList}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Orders</span>
            <span className="inline sm:hidden">Back</span>
          </Button>
          <h2 className="text-xl md:text-2xl font-semibold">Order Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Order ID</dt>
                  <dd className="mt-1 text-lg font-semibold">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
                  <dd className="mt-1">
                    <Badge className={`${getStatusBadgeColor(order.status)} capitalize`}>
                      {order.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Customer</dt>
                  <dd className="mt-1">{order.userName}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Date Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Order Date</dt>
                  <dd className="mt-1">{format(order.orderDate, 'dd MMM yyyy')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion Date</dt>
                  <dd className="mt-1">
                    {order.completionDate 
                      ? format(order.completionDate, 'dd MMM yyyy')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notes</CardTitle>
              <CardDescription>Add notes about this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Add notes about this order..."
                className="min-h-[100px] md:min-h-[120px]"
                value={notes}
                onChange={handleNotesChange}
              />
              {isNotesEdited && (
                <Button 
                  className="mt-3 w-full bg-pharma-600 hover:bg-pharma-700"
                  onClick={handleSaveNotes}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-right font-medium">Total Items</TableCell>
                    <TableCell className="text-center font-medium">{order.total}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default OrderDetail; 