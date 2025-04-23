import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicines, Medicine } from "@/contexts/MedicineContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Search, History, Plus, Minus, Calendar, Loader2, AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, isBefore, addMonths, isAfter } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

// Define the form schemas
const formSchema = z.object({
  id: z.string().min(1, "Medicine ID is required"),
  name: z.string().min(2, "Medicine name is required"),
  category: z.string().min(1, "Category is required"),
  origin: z.string().min(1, "Asal Obat is required"),
  stock: z.coerce.number().min(0, "Stock must be a positive number or zero"),
  vialName: z.string().optional(),
  expDate: z.string().optional(),
  notes: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
});

const stockFormSchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be positive"),
  type: z.enum(['increase', 'decrease']),
  note: z.string().min(1, "Note is required")
});

type FormValues = z.infer<typeof formSchema>;
type StockFormValues = z.infer<typeof stockFormSchema>;

const MedicineData = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { 
    medicines, 
    addMedicine, 
    updateMedicine, 
    deleteMedicine, 
    updateStock,
    getMedicineById 
  } = useMedicines();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isCreatingMedicine, setIsCreatingMedicine] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      category: "",
      origin: "",
      stock: 0,
      vialName: "",
      expDate: "",
      notes: "",
      date: new Date(),
    },
  });

  const stockForm = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      quantity: 0,
      type: 'increase',
      note: "",
    },
  });

  // Handle edit parameter in URL
  useEffect(() => {
    if (editId && !isEditDialogOpen) {
      const medicine = getMedicineById(editId);
      if (medicine) {
        handleEditMedicine(medicine);
      }
    }
  }, [editId, medicines]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    } else if (!isLoading && user && user.role !== "superadmin") {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }
  }, [user, isLoading, navigate, toast]);

  const filteredMedicines = medicines.filter(
    (medicine) => {
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
      
      return basicFieldsMatch || expDateMatch;
    }
  );

  const handleAddMedicine = async (data: FormValues) => {
    // Create a medicine object
    const newMedicine = {
      id: data.id,
      name: data.name,
      category: data.category,
      origin: data.origin,
      stock: data.stock,
      vialName: data.vialName,
      expDate: data.expDate ? new Date(data.expDate) : undefined,
      notes: data.notes,
      createdDate: data.date,
    };
    
    // Add medicine and get a reference to the newly added medicine
    const addedMedicine = await addMedicine(newMedicine);
    
    // Always create a history entry for new medicines
    if (addedMedicine) {
      updateStock(
        addedMedicine.id,
        data.stock,
        'increase',
        data.notes || `Initial entry on ${format(data.date, 'dd MMM yyyy')}`
      );
    }
    
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEditMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    form.setValue("id", medicine.id);
    form.setValue("name", medicine.name);
    form.setValue("category", medicine.category);
    form.setValue("origin", medicine.origin);
    form.setValue("stock", medicine.stock);
    form.setValue("vialName", medicine.vialName || "");
    form.setValue("expDate", medicine.expDate ? medicine.expDate.toISOString().split('T')[0] : "");
    form.setValue("notes", medicine.notes || "");
    form.setValue("date", medicine.createdDate || medicine.createdAt);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMedicine = (data: FormValues) => {
    if (!selectedMedicine) return;
    
    // Make sure expDate is properly converted to a Date if present
    let expDateObj = undefined;
    if (data.expDate && data.expDate.trim() !== "") {
      expDateObj = new Date(data.expDate);
    }
    
    const updatedMedicine = {
      ...selectedMedicine,
      id: data.id,
      name: data.name,
      category: data.category,
      origin: data.origin,
      stock: data.stock,
      vialName: data.vialName && data.vialName.trim() !== "" ? data.vialName : undefined,
      expDate: expDateObj,
      notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
      createdDate: data.date,
      history: selectedMedicine.history, // Preserve the history
    };

    console.log("Updating medicine with data:", updatedMedicine);
    updateMedicine(updatedMedicine);
    setIsEditDialogOpen(false);
    setSelectedMedicine(null);
    form.reset();
    
    // Remove edit parameter from URL
    if (editId) {
      navigate('/medicine-data');
    }
  };

  const handleDeleteMedicine = (medicineId: string) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      deleteMedicine(medicineId);
    }
  };

  const handleViewHistory = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsHistoryDialogOpen(true);
  };
  
  const handleOpenStockDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    stockForm.reset();
    setIsStockDialogOpen(true);
  };

  const handleUpdateStock = (data: StockFormValues) => {
    if (!selectedMedicine) return;

    updateStock(
      selectedMedicine.id, 
      data.quantity, 
      data.type, 
      data.note
    );
    
    setIsStockDialogOpen(false);
    stockForm.reset();
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <MainLayout title="Manajemen Data Obat">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Data Obat</h2>
          <Button
            className="bg-pharma-600 hover:bg-pharma-700"
            onClick={() => {
              form.reset();
              setIsAddDialogOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Obat
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="relative w-full md:max-w-md">
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
                  <TableHead>Tanggal Ditambahkan</TableHead>
                  <TableHead className="text-left">Stok</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Exp Date</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.id}</TableCell>
                    <TableCell>{medicine.name}</TableCell>
                    <TableCell>{medicine.category}</TableCell>
                    <TableCell>{medicine.origin}</TableCell>
                    <TableCell>{format(medicine.createdDate || medicine.createdAt, 'dd MMM yyyy')}</TableCell>
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
                        <div className="ml-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStockDialog(medicine);
                            }}
                            title="Update Stock"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewHistory(medicine)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditMedicine(medicine)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteMedicine(medicine.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              No medicines found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search or add a new medicine
            </p>
          </div>
        )}

        {/* Add Medicine Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[480px] w-full rounded-lg">
            <DialogHeader>
              <DialogTitle>Tambahkan Obat Baru</DialogTitle>
            </DialogHeader>
            <div className="max-h-[450px] overflow-y-auto pr-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddMedicine)} className="space-y-3 p-1">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan ID Obat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan Nama Obat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan Kategori Obat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asal Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan Asal Obat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kuantiti Awal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter initial quantity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vialName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satuan Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan Satuan Obat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            placeholder="Select expiry date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan Note" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                if (!(date instanceof Date)) return false;
                                return date > new Date() || date < new Date("1900-01-01");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                disabled={isCreatingMedicine}
                onClick={form.handleSubmit(handleAddMedicine)}
              >
                {isCreatingMedicine ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Medicine
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Medicine Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[480px] w-full rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit Obat</DialogTitle>
            </DialogHeader>
            <div className="max-h-[450px] overflow-y-auto pr-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateMedicine)} className="space-y-3 p-1">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter medicine ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter medicine name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asal Obat</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter origin of medicine" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kuantiti Sekarang</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter quantity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vialName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Satuan</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vial name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            placeholder="Select expiry date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter notes about this medicine" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                if (!(date instanceof Date)) return false;
                                return date > new Date() || date < new Date("1900-01-01");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={form.handleSubmit(handleUpdateMedicine)}>Update Obat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stock History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Stock History: {selectedMedicine?.name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMedicine?.history.length ? (
                    selectedMedicine.history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              entry.type === 'increase'
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {entry.type === 'increase' ? 'Added' : 'Removed'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {entry.quantity} units
                        </TableCell>
                        <TableCell>{entry.note}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        No history records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Stock Dialog */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent className="sm:max-w-[380px]">
            <DialogHeader>
              <DialogTitle>Update Stock: {selectedMedicine?.name}</DialogTitle>
            </DialogHeader>
            <Form {...stockForm}>
              <form onSubmit={stockForm.handleSubmit(handleUpdateStock)} className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <FormField
                      control={stockForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action</FormLabel>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant={field.value === 'increase' ? 'default' : 'outline'}
                              className={field.value === 'increase' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => field.onChange('increase')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Stock
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'decrease' ? 'default' : 'outline'}
                              className={field.value === 'decrease' ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => field.onChange('decrease')}
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Remove Stock
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={stockForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Enter quantity" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a note for this stock change" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Update Stock</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default MedicineData; 