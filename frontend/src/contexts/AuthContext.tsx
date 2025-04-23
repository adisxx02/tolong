import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

export type UserRole = "superadmin" | "user";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  whatsapp?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("tambakaji_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure id exists
        if (!parsedUser.id && parsedUser._id) {
          parsedUser.id = parsedUser._id;
        }
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("tambakaji_user");
      }
    }
    setIsLoading(false);
  }, []);
  
  // Calculate isAdmin based on user role
  const isAdmin = user?.role === "superadmin";
  
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await api.login({ username, password });
      
      // Ensure user data has the expected id field
      const normalizedUserData = {
        ...userData,
        id: userData.id || userData._id // Use id if available, fall back to _id
      };
      
      setUser(normalizedUserData);
      localStorage.setItem("tambakaji_user", JSON.stringify(normalizedUserData));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${normalizedUserData.username}!`,
      });
      
      return normalizedUserData;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("tambakaji_user");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
