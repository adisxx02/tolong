import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (user?.role === "superadmin") {
          navigate("/dashboard");
        } else {
          navigate("/user-home");
        }
      } else {
        navigate("/login");
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-pharma-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Index;
