import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { users } from "@/lib/mockData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CounterLogin() {
    const navigate = useNavigate();
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);

    // Filter counter-capable users
    const counterUsers = users.filter(u => u.role === 'counter' || u.role === 'admin' || u.role === 'supervisor');

    // Keyboard support for numpad and top row numbers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^[0-9]$/.test(e.key)) {
                handlePinChange(e.key);
            } else if (e.key === "Backspace") {
                handleDelete();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [pin, selectedUser]);

    // Auto-select first user if none selected
    useEffect(() => {
        if (!selectedUser && counterUsers.length > 0) {
            setSelectedUser(counterUsers[0]);
        }
    }, [selectedUser, counterUsers]);

    const handlePinChange = (digit: string) => {
        if (!selectedUser) {
            setError("Please select an operator first");
            return;
        }

        if (pin.length < 4) {
            const newPin = pin + digit;
            setPin(newPin);
            setError("");

            if (newPin.length === 4) {
                if (selectedUser.pin === newPin) {
                    localStorage.setItem('currentUser', JSON.stringify(selectedUser));
                    toast.success("Login successful!", {
                        description: `Welcome back, ${selectedUser.name}!`,
                    });
                    navigate('/counter/pos');
                } else {
                    setError("Invalid PIN. Please try again.");
                    setTimeout(() => setPin(""), 500);
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError("");
    };

    return (
        <div className="min-h-screen gradient-cream flex flex-col overflow-y-auto">
            {/* Header */}
            <header className="pt-12 pb-6 px-6 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-warm mb-3 p-1 overflow-hidden border border-primary/10">
                    <img src="/logos/logo1white.jfif" alt="Ama Bakery Logo" className="h-full w-full object-cover" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Ama Bakery</h1>
                <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest mt-1">Counter Terminal</p>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 flex flex-col items-center justify-center pb-12">
                <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl animate-slide-up">

                    {/* Left Side: User Selection */}
                    <div className="flex-1 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Select Operator</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                            {counterUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setPin("");
                                        setError("");
                                    }}
                                    className={cn(
                                        "p-4 rounded-[1.5rem] border-4 transition-all flex flex-col items-center gap-2 active:scale-95 shadow-sm",
                                        selectedUser?.id === user.id
                                            ? "border-primary bg-white shadow-xl shadow-primary/10"
                                            : "border-white bg-white/50 hover:border-primary/20"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                                        selectedUser?.id === user.id ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <User className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        "font-black text-[10px] uppercase tracking-wider",
                                        selectedUser?.id === user.id ? "text-slate-800" : "text-slate-500"
                                    )}>{user.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: PIN Entry */}
                    <div className="card-elevated p-8 w-full lg:w-[400px] border-4 border-white flex flex-col items-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Lock className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-black text-slate-700 text-sm">Operator Access</span>
                        </div>

                        {selectedUser && (
                            <p className="text-xs text-primary font-bold text-center mb-6">
                                Welcome back, {selectedUser.name}
                            </p>
                        )}

                        {/* PIN Dots */}
                        <div className="flex justify-center gap-4 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${i < pin.length
                                        ? error ? 'bg-destructive border-destructive scale-110' : 'bg-primary border-primary scale-110 shadow-lg shadow-primary/20'
                                        : 'bg-white border-slate-200'
                                        }`}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 p-2 bg-destructive/5 border border-destructive/10 rounded-xl w-full">
                                <p className="text-destructive text-[10px] font-bold text-center">{error}</p>
                            </div>
                        )}

                        {/* Number Pad */}
                        <div className="grid grid-cols-3 gap-3 mb-6 w-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((item, index) => (
                                <Button
                                    key={index}
                                    variant={item === 'del' ? 'outline' : 'secondary'}
                                    className={`h-14 text-xl font-black rounded-2xl transition-all active:scale-95 ${item === 'del' ? 'bg-white border-2' : 'bg-slate-50 hover:bg-white hover:shadow-md'
                                        }`}
                                    disabled={item === null}
                                    onClick={() => {
                                        if (item === 'del') {
                                            handleDelete();
                                        } else if (item !== null) {
                                            handlePinChange(item.toString());
                                        }
                                    }}
                                >
                                    {item === 'del' ? '⌫' : item === null ? '' : item}
                                </Button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 opacity-50 w-full">
                            <Monitor className="h-3 w-3 text-slate-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Keyboard Numpad Enabled</span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="mt-8 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
                    onClick={() => navigate('/')}
                >
                    ← Exit to Role Selection
                </Button>
            </main>
        </div>
    );
}
