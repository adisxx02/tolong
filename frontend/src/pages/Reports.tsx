import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders, Order } from "@/contexts/OrderContext";
import { Search, RefreshCw, Download, FileText, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isWithinInterval, parseISO, subDays, subWeeks, subMonths } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const Reports = () => {
  const { user, isAdmin } = useAuth();
  const { orders, isLoading, refreshOrders } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("week");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect non-admins
  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "Only administrators can access the reports page.",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, navigate, toast]);

  // Force a refresh when the component mounts to ensure we have the latest data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsRefreshing(true);
      try {
        await refreshOrders();
      } catch (error) {
        console.error("Error loading initial order data:", error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    loadInitialData();
  }, [refreshOrders]);

  // Update date range when timeRange changes
  useEffect(() => {
    const now = new Date();
    
    switch (timeRange) {
      case "today":
        setStartDate(new Date(now.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      case "week":
        setStartDate(subWeeks(now, 1));
        setEndDate(new Date());
        break;
      case "month":
        setStartDate(subMonths(now, 1));
        setEndDate(new Date());
        break;
      case "3months":
        setStartDate(subMonths(now, 3));
        setEndDate(new Date());
        break;
      case "custom":
        // Don't change dates for custom
        break;
      default:
        setStartDate(subWeeks(now, 1));
        setEndDate(new Date());
    }
  }, [timeRange]);

  // Filter orders based on search term and date range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    
    // Check if order is within selected date range
    const isInDateRange = isWithinInterval(orderDate, {
      start: startDate,
      end: endDate
    });
    
    // Apply search term filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        isInDateRange &&
        (order.id.toLowerCase().includes(searchTermLower) ||
        order.userName.toLowerCase().includes(searchTermLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTermLower)))
      );
    }
    
    return isInDateRange;
  });
  
  // Sort orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
      toast({
        title: "Data Refreshed",
        description: "Orders have been refreshed from the database.",
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

  const exportToCSV = () => {
    if (sortedOrders.length === 0) {
      toast({
        title: "No Data",
        description: "There are no orders to export.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV header and rows
    const headers = ["Order ID", "User Name", "Order Date", "Completion Date", "Status", "Total Items", "Item Details"];
    
    const csvRows = [
      headers.join(','),
      ...sortedOrders.map(order => {
        const rowData = [
          `"${order.id}"`,
          `"${order.userName}"`,
          `"${format(new Date(order.orderDate), 'dd/MM/yyyy HH:mm')}"`,
          order.completionDate ? `"${format(new Date(order.completionDate), 'dd/MM/yyyy HH:mm')}"` : `"Not completed"`,
          `"${order.status}"`,
          `"${order.total}"`,
          `"${order.items.map(item => `${item.name} (${item.quantity})`).join('; ')}"`
        ];
        return rowData.join(',');
      })
    ];
    
    // Create Blob and download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateRange = `${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_report_${dateRange}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Report has been exported to CSV successfully.",
    });
  };

  const getTotalItemsCount = () => {
    return sortedOrders.reduce((total, order) => total + order.total, 0);
  };
  
  const getCompletedOrdersCount = () => {
    return sortedOrders.filter(order => order.status === 'completed').length;
  };

  // View order details
  const viewOrderDetails = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  return (
    <MainLayout title="Order Reports">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Order Reports</h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToCSV}
              disabled={sortedOrders.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sortedOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                in selected time period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCompletedOrdersCount()}</div>
              <p className="text-xs text-muted-foreground">
                in selected time period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalItemsCount()}</div>
              <p className="text-xs text-muted-foreground">
                across all orders
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white dark:bg-slate-950 rounded-md shadow">
          <div className="p-4 border-b flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="flex items-center gap-2">
                <Select
                  value={timeRange}
                  onValueChange={setTimeRange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {timeRange === "custom" && (
                <div className="flex gap-2">
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date);
                            setIsStartDateOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(date);
                            setIsEndDateOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading orders...</p>
            </div>
          ) : sortedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.userName}</TableCell>
                      <TableCell>
                        {order.items.length > 0 
                          ? (order.items.length > 2 
                              ? `${order.items[0].name}, ${order.items[1].name}, +${order.items.length - 2} more` 
                              : order.items.map(item => item.name).join(", ")
                            )
                          : "No items"
                        }
                      </TableCell>
                      <TableCell>{format(new Date(order.orderDate), "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell>
                        {order.completionDate 
                          ? format(new Date(order.completionDate), "dd MMM yyyy HH:mm")
                          : "Not completed"
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{order.total}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewOrderDetails(order.id)}
                          title="View Order Details"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p>No orders found in the selected time period.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports; 