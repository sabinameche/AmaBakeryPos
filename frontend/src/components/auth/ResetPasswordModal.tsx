import { useState } from "react";
import { Lock, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminResetPassword } from "@/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        username: string;
        full_name: string;
    } | null;
}

export function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState("amabakery@123");
    const [confirmPassword, setConfirmPassword] = useState("amabakery@123");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            await adminResetPassword(user.id, newPassword);
            toast.success(`Password for ${user.username} has been reset`);
            setNewPassword("");
            setConfirmPassword("");
            onClose();
        } catch (err: any) {
            toast.error("Reset failed", {
                description: err.message || "You might not have permission to reset this user's password."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-destructive p-6 text-white relative">
                    <DialogTitle className="text-xl font-black mb-1">Administrative Reset</DialogTitle>
                    <DialogDescription className="text-white/70 font-medium">
                        Resetting password for <span className="text-white font-bold">{user.full_name || user.username}</span>
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pl-11 h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-destructive/20"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-11 pr-11 h-11 bg-slate-50 border-slate-100 rounded-xl focus:ring-destructive/20"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-2">
                        <p className="text-[10px] text-amber-700 font-bold leading-tight uppercase tracking-tight">
                            ⚠️ Warning: This action will immediately change the user's password. They will need to use the new password to log in.
                        </p>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="destructive"
                            className="w-full h-11 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-destructive/20 transition-all"
                        >
                            {loading ? "Resetting..." : "Confirm Reset"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
