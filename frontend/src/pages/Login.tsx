import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userData = await login(username, password);
      // Redirect based on user role
      if (userData.role === "superadmin") {
        navigate("/dashboard");
      } else {
        navigate("/medicines");
      }
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pharma-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pharma-600 mb-4">
            <span className="text-white font-bold text-2xl">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tambakaji Farmasi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Internal Pharmacy Management System</p>
        </div>

        <Card className="w-full shadow-lg border-slate-200/60 dark:border-slate-700/30 overflow-hidden animate-fade-in delay-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="username"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-pharma-600 hover:bg-pharma-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 py-3">
            <div className="flex items-center justify-center w-full text-sm text-slate-500 dark:text-slate-400">
              <LockKeyhole className="h-3.5 w-3.5 mr-1" />
              <span>Secure internal access only</span>
            </div>
          </CardFooter>
        </Card>
        
        {/* <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 animate-fade-in delay-150">
          <p>Demo credentials:</p>
          <p>Admin: admin / admin123</p>
          <p>User: user / user123</p>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
