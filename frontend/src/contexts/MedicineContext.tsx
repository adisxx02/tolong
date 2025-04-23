import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

// Types for our data
export interface StockHistory {
  id: string;
  date: Date;
  quantity: number;
  type: 'increase' | 'decrease';
  note: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  origin: string;
  stock: number;
  vialName?: string;
  expDate?: Date;
  history: StockHistory[];
  image?: string;
  createdAt: Date;
  createdDate?: Date;
  notes?: string;
}

interface MedicineContextType {
  medicines: Medicine[];
  isLoading: boolean;
  addMedicine: (medicine: Omit<Medicine, 'history' | 'createdAt'>) => Promise<Medicine | null>;
  updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number, type: 'increase' | 'decrease', note: string) => Promise<void>;
  getMedicineById: (id: string) => Medicine | undefined;
  refreshMedicines: () => Promise<void>;
}

const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

export const useMedicines = () => {
  const context = useContext(MedicineContext);
  if (!context) {
    throw new Error("useMedicines must be used within a MedicineProvider");
  }
  return context;
};

export const MedicineProvider = ({ children }: { children: ReactNode }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Function to fetch medicines from API
  const fetchMedicines = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMedicines();
      // Transform dates from strings to Date objects
      const formattedData = data.map((med: any) => ({
        ...med,
        createdAt: new Date(med.createdAt),
        createdDate: med.createdDate ? new Date(med.createdDate) : undefined,
        history: med.history.map((hist: any) => ({
          ...hist,
          date: new Date(hist.date)
        }))
      }));
      setMedicines(formattedData);
      return formattedData;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load medicines",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Exposed function to refresh medicines
  const refreshMedicines = async () => {
    try {
      setIsLoading(true);
      await fetchMedicines();
      console.log("Medicines refreshed successfully");
    } catch (error) {
      console.error("Error refreshing medicines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load medicines when component mounts
  useEffect(() => {
    fetchMedicines();
  }, [toast]);

  const addMedicine = async (medicineData: Omit<Medicine, 'history' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newMedicine = await api.addMedicine(medicineData);
      
      // Format dates
      const formattedMedicine = {
        ...newMedicine,
        createdAt: new Date(newMedicine.createdAt),
        createdDate: newMedicine.createdDate ? new Date(newMedicine.createdDate) : undefined,
        history: newMedicine.history.map((hist: any) => ({
          ...hist,
          date: new Date(hist.date)
        }))
      };
      
      setMedicines([...medicines, formattedMedicine]);
      
      toast({
        title: "Medicine Added",
        description: `Medicine ${medicineData.name} has been added successfully`,
      });
      
      return formattedMedicine;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add medicine",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedicine = async (updatedMedicine: Medicine) => {
    try {
      setIsLoading(true);
      await api.updateMedicine(updatedMedicine.id, updatedMedicine);
      
      setMedicines(medicines.map(medicine => 
        medicine.id === updatedMedicine.id ? updatedMedicine : medicine
      ));
      
      toast({
        title: "Medicine Updated",
        description: `Medicine ${updatedMedicine.name} has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update medicine",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      setIsLoading(true);
      const medicineToDelete = medicines.find(m => m.id === id);
      if (!medicineToDelete) return;

      await api.deleteMedicine(id);
      
      setMedicines(medicines.filter(medicine => medicine.id !== id));
      
      toast({
        title: "Medicine Deleted",
        description: `Medicine ${medicineToDelete.name} has been deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete medicine",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStock = async (id: string, quantity: number, type: 'increase' | 'decrease', note: string) => {
    try {
      setIsLoading(true);
      const medicineToUpdate = medicines.find(m => m.id === id);
      if (!medicineToUpdate) return;

      // Handle special case for initial entries with 0 quantity
      const isInitialEntry = medicineToUpdate.history.length === 0 && quantity === 0;
      
      const updatedStock = 
        type === 'increase' 
          ? medicineToUpdate.stock + quantity 
          : medicineToUpdate.stock - quantity;
      
      // Prevent negative stock (skip this check for initial entries with 0 quantity)
      if (!isInitialEntry && updatedStock < 0) {
        toast({
          title: "Error",
          description: "Stock cannot be negative. Please enter a valid quantity.",
          variant: "destructive"
        });
        return;
      }

      // Send the stock update to the API
      const stockData = {
        quantity,
        type,
        note
      };
      
      const updatedMedicine = await api.updateStock(id, stockData);
      
      // Format the updated medicine
      const formattedMedicine = {
        ...updatedMedicine,
        createdAt: new Date(updatedMedicine.createdAt),
        createdDate: updatedMedicine.createdDate ? new Date(updatedMedicine.createdDate) : undefined,
        history: updatedMedicine.history.map((hist: any) => ({
          ...hist,
          date: new Date(hist.date)
        }))
      };
      
      // Update local state
      setMedicines(medicines.map(medicine => 
        medicine.id === id ? formattedMedicine : medicine
      ));

      // Customize the message for initial entries with 0 quantity
      if (isInitialEntry) {
        toast({
          title: "History Updated",
          description: `Added initial history entry for ${medicineToUpdate.name}`,
        });
      } else {
        toast({
          title: "Stock Updated",
          description: `${medicineToUpdate.name} stock has been ${type === 'increase' ? 'increased' : 'decreased'} by ${quantity} units`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stock",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMedicineById = (id: string) => {
    return medicines.find(medicine => medicine.id === id);
  };

  return (
    <MedicineContext.Provider
      value={{
        medicines,
        isLoading,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        updateStock,
        getMedicineById,
        refreshMedicines,
      }}
    >
      {children}
    </MedicineContext.Provider>
  );
}; 