import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicines, Medicine } from "@/contexts/MedicineContext";
import { useOrders } from "@/contexts/OrderContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  ShoppingCart,
  MinusCircle,
  PlusCircleIcon,
  Check,
  AlertTriangle,
  Plus,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { format, isBefore, addMonths, isAfter } from "date-fns";
import Reports from "./pages/Reports";

// ExpDateBadge component to show expiration date with visual indicators
const ExpDateBadge = ({ expDate }: { expDate: Date }) => {
  const today = new Date();
  const threeMonthsFromNow = addMonths(today, 3);
  const isExpired = isBefore(expDate, today);
  const isExpiringSoon = !isExpired && isBefore(expDate, threeMonthsFromNow);
  
  return (
    <div className="flex items-center">
      <div
        className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center ${
          isExpired
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : isExpiringSoon
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {isExpired && <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />}
        <span>{format(expDate, 'dd MMM yyyy')}</span>
      </div>
    </div>
  );
};

const MedicineList = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { medicines, deleteMedicine } = useMedicines();
  const { addOrder } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cart, setCart] = useState<Array<{medicine: Medicine, quantity: number}>>([]);
  const [isCartViewOpen, setIsCartViewOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);
  
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
  
  const handleAddToCart = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setCartQuantity(1);
    setIsCartDialogOpen(true);
  };
  
  const confirmAddToCart = () => {
    if (!selectedMedicine) return;
    
    // Check if the medicine is already in the cart
    const existingCartItemIndex = cart.findIndex(item => item.medicine.id === selectedMedicine.id);
    
    if (existingCartItemIndex >= 0) {
      // Update quantity if the medicine is already in the cart
      const updatedCart = [...cart];
      updatedCart[existingCartItemIndex].quantity += cartQuantity;
      setCart(updatedCart);
    } else {
      // Add new item to the cart
      setCart([...cart, { medicine: selectedMedicine, quantity: cartQuantity }]);
    }
    
    // Save cart to localStorage
    localStorage.setItem("tambakaji_cart", JSON.stringify(
      [...cart, { medicine: selectedMedicine, quantity: cartQuantity }]
    ));
    
    toast({
      title: "Added to Cart",
      description: `${cartQuantity} ${selectedMedicine.name} added to your cart`,
    });
    
    setIsCartDialogOpen(false);
  };

  const handleRemoveFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
    
    // Update localStorage
    localStorage.setItem("tambakaji_cart", JSON.stringify(updatedCart));
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0 || !user) return;
    
    // Calculate total quantity
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Create order items
    const orderItems = cart.map((item, index) => ({
      id: `OI${Date.now().toString().slice(-6)}${index}`,
      medicineId: item.medicine.id,
      name: item.medicine.name,
      quantity: item.quantity,
      price: 0, // Setting price to 0 as we're not tracking prices
    }));
    
    // Create the order
    addOrder({
      userId: user.id.toString(),
      userName: user.username,
      items: orderItems,
      completionDate: null,
      status: 'pending',
      total: totalQuantity, // Using total quantity instead of price
    });
    
    // Clear the cart and show success message
    setCart([]);
    // Clear localStorage
    localStorage.removeItem("tambakaji_cart");
    setIsCartViewOpen(false);
    setIsOrderSuccessOpen(true);
  };
  
  const handleEditMedicine = (medicine: Medicine) => {
    navigate(`/medicine-data?edit=${medicine.id}`);
  };
  
  const handleDeleteMedicine = (medicine: Medicine) => {
    if (confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      deleteMedicine(medicine.id);
    }
  };
  
  const getUniqueCategories = () => {
    const categories = medicines.map(medicine => medicine.category);
    return ["all", ...new Set(categories)];
  };
  
  const filteredMedicines = medicines.filter(medicine => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Basic fields search
    const basicFieldsMatch = 
      medicine.name.toLowerCase().includes(searchTermLower) ||
      medicine.category.toLowerCase().includes(searchTermLower) ||
      medicine.id.toLowerCase().includes(searchTermLower) ||
      medicine.origin.toLowerCase().includes(searchTermLower);
    
    // Expiration date search
    let expDateMatch = false;
    if (medicine.expDate) {
      const expDateStr = format(new Date(medicine.expDate), 'dd MMM yyyy').toLowerCase();
      const numericExpDateStr = format(new Date(medicine.expDate), 'dd/MM/yyyy').toLowerCase();
      expDateMatch = 
        expDateStr.includes(searchTermLower) ||
        numericExpDateStr.includes(searchTermLower);
    }
    
    // Apply category and stock filters
    const matchesCategory = categoryFilter === "all" || medicine.category === categoryFilter;
    const matchesStock = 
      stockFilter === "all" || 
      (stockFilter === "in-stock" && medicine.stock > 0) ||
      (stockFilter === "out-of-stock" && medicine.stock === 0);
    
    return (basicFieldsMatch || expDateMatch) && matchesCategory && matchesStock;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <MainLayout title="List Obat">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">List Obat</h2>
          
          <div className="flex gap-3">
            {user.role !== "superadmin" && (
              <Button
                variant="outline"
                className="flex items-center gap-2 border-pharma-200 text-pharma-700"
                onClick={() => setIsCartViewOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>View Cart</span>
                {cart.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-pharma-500 text-white">
                    {cart.length}
                  </span>
                )}
              </Button>
            )}
            
            {user.role === "superadmin" && (
              <Button
                className="bg-pharma-600 hover:bg-pharma-700"
                onClick={() => navigate("/medicine-data")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-[13px] h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by ID, Nama, Kategori, Asal Obat, or Exp Date (dd MMM yyyy)"
                className="pl-10 pr-10 w-full h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-[13px] text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
              <div className="text-xs text-slate-500 mt-1 ml-1">
                Hint: For Exp Date, you can search using formats like "Jan 2024", "15 Jan", or "15/01/2024"
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredMedicines.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Obat</TableHead>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Asal Obat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Exp Date</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell>{medicine.id}</TableCell>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>{medicine.category}</TableCell>
                    <TableCell>{medicine.origin}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center justify-between min-w-[100px] w-max ${
                            medicine.stock > 10
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : medicine.stock > 0
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          <span className="whitespace-nowrap">
                            {medicine.stock > 0 
                              ? `${medicine.stock} ${medicine.vialName || 'units'}` 
                              : "Out of stock"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {medicine.vialName ? (
                        <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md dark:bg-blue-900/20 dark:text-blue-300">
                          {medicine.vialName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {medicine.expDate ? (
                        <ExpDateBadge expDate={new Date(medicine.expDate)} />
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {user.role === "superadmin" ? (
                          // Superadmin actions: Edit and Delete
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditMedicine(medicine)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteMedicine(medicine)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          // Regular user action: Add to Cart
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 text-pharma-600 border-pharma-200 hover:bg-pharma-50 hover:text-pharma-700"
                            onClick={() => handleAddToCart(medicine)}
                            disabled={medicine.stock <= 0}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </Button>
                        )}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M12 6a6 6 0 110 12 6 6 0 010-12z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              No medicines found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Add to Cart Dialog */}
        <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add to Cart</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">{selectedMedicine?.name}</h3>
              <p className="mb-4 text-slate-500">Available: {selectedMedicine?.stock} units</p>
              
              <div className="flex items-center gap-3 my-6 justify-center">
                <Button
                  variant="outline" 
                  size="icon"
                  onClick={() => setCartQuantity(prev => Math.max(1, prev - 1))}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  className="text-xl font-semibold w-16 text-center border rounded-md py-1"
                  value={cartQuantity}
                  min={1}
                  max={selectedMedicine?.stock || 999}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value)) {
                      setCartQuantity(Math.max(1, Math.min(selectedMedicine?.stock || 999, value)));
                    }
                  }}
                />
                <Button
                  variant="outline" 
                  size="icon"
                  onClick={() => setCartQuantity(prev => Math.min(selectedMedicine?.stock || 999, prev + 1))}
                >
                  <PlusCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                className="bg-pharma-600 hover:bg-pharma-700"
                onClick={confirmAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Cart Dialog */}
        <Dialog open={isCartViewOpen} onOpenChange={setIsCartViewOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Your Cart</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {cart.length > 0 ? (
                <div className="space-y-6">
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.medicine.name}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
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
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-lg font-semibold mb-6">
                      <span>Total Items:</span>
                      <span>{cart.reduce((total, item) => total + item.quantity, 0)} units</span>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Continue Shopping</Button>
                      </DialogClose>
                      <Button 
                        className="bg-pharma-600 hover:bg-pharma-700"
                        onClick={handlePlaceOrder}
                      >
                        Place Order
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Your cart is empty
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Add some medicines to your cart to place an order
                  </p>
                  <DialogClose asChild>
                    <Button variant="outline">Continue Shopping</Button>
                  </DialogClose>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Success Dialog */}
        <Dialog open={isOrderSuccessOpen} onOpenChange={setIsOrderSuccessOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Order Placed Successfully!</h3>
              <p className="text-slate-500 mb-6">
                Your order has been received and is being processed.
              </p>
              <div className="space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/user-orders")}
                >
                  View Orders
                </Button>
                <Button
                  className="bg-pharma-600 hover:bg-pharma-700"
                  onClick={() => setIsOrderSuccessOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default MedicineList;
