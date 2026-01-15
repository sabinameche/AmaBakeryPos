import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();
    const { roleId } = useParams<{ roleId: string }>();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const roleTitle = roleId === 'kitchen' ? 'Kitchen Display' : roleId === 'admin' ? 'Administration' : 'Login';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Static credentials check
        const valid = (roleId === 'kitchen' && username === 'kitchen' && password === 'kitchen') ||
            (roleId === 'admin' && username === 'admin' && password === 'admin');

        if (valid) {
            toast.success("Login Successful", {
                description: `Welcome to ${roleTitle}`,
            });
            // Navigate to the respective dashboard
            navigate(roleId === 'kitchen' ? '/kitchen' : '/admin');
        } else {
            setError("Invalid credentials. Please try again.");
            toast.error("Login Failed", {
                description: "Invalid username or password",
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50/50 relative overflow-hidden transition-colors duration-500">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white to-transparent opacity-60 -z-10" />

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-6">
                        <img
                            src="/logos/logo2brown.jpeg"
                            alt="Ama Bakery Logo"
                            className="h-20 w-20 rounded-[1.5rem] object-cover border-4 border-white shadow-lg mx-auto"
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2 text-stone-800">
                        {roleTitle} Login
                    </h1>
                    <p className="text-stone-400 text-sm">
                        Please enter your credentials to continue
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 p-8 border border-stone-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 ml-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-12 h-12 bg-stone-50 border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all font-medium text-stone-700"
                                        placeholder="Enter username"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-12 bg-stone-50 border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all font-medium text-stone-700 font-mono"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-stone-200 hover:shadow-xl transition-all hover:-translate-y-0.5 bg-stone-800 hover:bg-stone-900 text-white"
                        >
                            Sign In
                            <ArrowRight className="h-5 w-5 ml-2 opacity-80" />
                        </Button>
                    </form>
                </div>

                {/* Footer Action */}
                <div className="mt-8 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-stone-400 hover:text-stone-600 hover:bg-transparent -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Selection
                    </Button>
                </div>

            </div>
        </div>
    );
}
