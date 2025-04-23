import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Minus, 
  ShoppingCart,
  Edit,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export interface Medicine {
  id: string;
  name: string;
  stock: number;
  category: string;
  image: string;
  createdAt: Date;
}

interface MedicineCardProps {
  medicine: Medicine;
  onAddToCart?: (medicine: Medicine, quantity: number) => void;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (medicine: Medicine) => void;
}

export const MedicineCard = ({ 
  medicine, 
  onAddToCart, 
  onEdit, 
  onDelete 
}: MedicineCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuperAdmin = user?.role === "superadmin";
  
  const incrementQuantity = () => {
    if (quantity < medicine.stock) {
      setQuantity(quantity + 1);
    } else {
      toast({
        title: "Maximum stock reached",
        description: `Only ${medicine.stock} items available`,
        variant: "destructive",
      });
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(medicine, quantity);
      toast({
        title: "Added to cart",
        description: `${quantity} ${medicine.name} added to cart`,
      });
      setQuantity(1);
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-200 dark:border-slate-700 h-full flex flex-col">
      <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
        <img 
          src={medicine.image || "/placeholder.svg"} 
          alt={medicine.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge className="absolute top-2 right-2 bg-pharma-600">
          {medicine.category}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <h3 className="font-medium text-lg line-clamp-1">{medicine.name}</h3>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Stock:
          </span>
          <Badge variant={medicine.stock > 0 ? "outline" : "destructive"}>
            {medicine.stock > 0 ? `${medicine.stock} available` : "Out of stock"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
        {isSuperAdmin ? (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit && onEdit(medicine)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={() => onDelete && onDelete(medicine)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || medicine.stock <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <input
                  type="number"
                  className="mx-2 w-12 text-center font-medium border rounded-md py-0.5 text-sm"
                  value={quantity}
                  min={1}
                  max={medicine.stock}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value)) {
                      setQuantity(Math.max(1, Math.min(medicine.stock, value)));
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={incrementQuantity}
                  disabled={quantity >= medicine.stock || medicine.stock <= 0}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button 
              className="w-full bg-pharma-600 hover:bg-pharma-700"
              disabled={medicine.stock <= 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
