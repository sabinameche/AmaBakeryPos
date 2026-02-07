import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { loginUsers, fetchMe } from "../api/index.js";

import { isLoggedIn, getCurrentUser } from "../auth/auth";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role?: string) => {
    switch (role) {
      case "ADMIN":
        navigate("/super-admin/dashboard", { replace: true });
        break;
      case "BRANCH_MANAGER":
        navigate("/admin/dashboard", { replace: true });
        break;
      case "WAITER":
        navigate("/waiter/tables", { replace: true });
        break;
      case "COUNTER":
        navigate("/counter/orders", { replace: true });
        break;
      case "KITCHEN":
        navigate("/kitchen/display", { replace: true });
        break;
      default:
        navigate("/login", { replace: true });
    }
  };

  // auto redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      const user = getCurrentUser();
      if (user?.role) redirectByRole(user.role);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) login -> save tokens
      await loginUsers(username, password);

      // 2) The tokens are already saved in localStorage by loginUsers.
      // We can now get the user info from the token.
      const user = getCurrentUser();

      if (!user?.role) {
        throw new Error("Unable to identify user role from token.");
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
      if (user.role === "WAITER") {
        localStorage.setItem("currentWaiter", JSON.stringify(user));
      }

      toast.success("Login Successful", {
        description: `Welcome, ${user?.username || username}! (${user.role})`,
      });

      redirectByRole(user.role);
    } catch (err: any) {
      const msg = err?.message || "Invalid username or password";
      setError(msg);
      toast.error("Login Failed", { description: msg });
      console.error("LOGIN ERROR:", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            <div className="inline-flex items-center justify-center h-32 w-32 rounded-[2rem] bg-white shadow-2xl p-2 overflow-hidden mb-8">
              <img
                src="/logos/logo1white.jfif"
                alt="Ama Bakery Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-5xl font-rockwell font-bold">Ama Bakery</h1>
            <p className="text-white/80 text-sm font-bold uppercase tracking-[0.3em]">
              Management Suite
            </p>

            <p className="text-xl font-medium text-white/90 pt-6">
              Secure access for staff members
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-cream">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[2rem] shadow-xl border-4 border-white p-8 md:p-10">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium mb-8">Sign in to access your account</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl text-base font-black uppercase tracking-widest"
              >
                {loading ? "Signing In..." : "Sign In"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>

            <p className="text-xs text-center text-slate-400 mt-6">
              Secure authentication for all staff members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}