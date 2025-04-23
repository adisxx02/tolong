import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  PillIcon, 
  ClipboardList, 
  ShoppingCart,
  ChevronLeft,
  Menu,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPath, setCurrentPath] = useState(location.pathname);
  
  // Check screen size and set initial sidebar state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    // Run on mount
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Update currentPath when location changes
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const menuItems = [
    ...(user?.role === "superadmin"
      ? [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/dashboard",
          },
          {
            label: "Users",
            icon: Users,
            path: "/users",
          },
          {
            label: "Data Obat",
            icon: PillIcon,
            path: "/medicine-data",
          },
        ]
      : []),
    {
      label: "List Obat",
      icon: PillIcon,
      path: "/medicines",
    },
    ...(user?.role === "superadmin"
      ? [
          {
            label: "Order Data",
            icon: ClipboardList,
            path: "/orders",
          },
          {
            label: "Reports",
            icon: BarChart,
            path: "/reports",
          },
        ]
      : [
          {
            label: "My Orders",
            icon: ClipboardList,
            path: "/user-orders",
          },
          {
            label: "Cart",
            icon: ShoppingCart,
            path: "/cart",
          },
        ]),
  ];
  
  const handleMenuClick = (path: string) => {
    // Only navigate if the path is different
    if (path !== currentPath) {
      navigate(path);
      setCurrentPath(path);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate("/login");
    toast({
      title: "Logged out successfully",
      duration: 2000,
    });
  };
  
  return (
    <div className="flex h-full relative">
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-40 shadow-sm",
          isMobile 
            ? "fixed w-64 max-w-[80%]" 
            : "w-64 relative",
          isSidebarOpen 
            ? "translate-x-0" 
            : isMobile 
              ? "-translate-x-full" 
              : "w-20"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className={cn(
            "flex items-center h-16 px-4",
            !isSidebarOpen && !isMobile && "justify-center"
          )}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-pharma-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">TA</span>
              </div>
              {(isSidebarOpen || isMobile) && (
                <span className="text-lg font-medium">SiTaring Tambakaji</span>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Menu */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleMenuClick(item.path)}
                    className={cn(
                      "w-full flex items-center py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                      "hover:bg-pharma-50 hover:text-pharma-700 dark:hover:bg-slate-800 dark:hover:text-pharma-400",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-pharma-500",
                      location.pathname === item.path
                        ? "bg-pharma-50 text-pharma-700 dark:bg-slate-800 dark:text-pharma-400"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      !isSidebarOpen && !isMobile && "mx-auto"
                    )} />
                    {(isSidebarOpen || isMobile) && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-3">
            <Button
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {(isSidebarOpen || isMobile) && <span>Log out</span>}
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen overflow-hidden",
        isMobile ? "w-full" : ""
      )}>
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 sticky top-0 z-30">
          <button 
            className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-4"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? 
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" /> : 
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            }
          </button>
          <h1 className="text-xl font-medium truncate">{title}</h1>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
