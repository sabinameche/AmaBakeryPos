import { LogOut } from "lucide-react";
import { logout, isLoggedIn, getCurrentUser } from "@/auth/auth";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";


import { useLocation } from "react-router-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";

export function GlobalLogout() {
    const location = useLocation();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const isLoginPage = location.pathname === "/login" || location.pathname === "/super-admin";


    // Handle unauthorized event from api/index.js and manual logout triggers
    useEffect(() => {
        const handleUnauthorized = () => {
            console.warn("Session expired or unauthorized. Logging out...");
            logout();
        };

        const handleShowConfirm = () => {
            setShowConfirm(true);
        };

        window.addEventListener("unauthorized", handleUnauthorized);
        window.addEventListener("show-logout-confirm", handleShowConfirm);
        return () => {
            window.removeEventListener("unauthorized", handleUnauthorized);
            window.removeEventListener("show-logout-confirm", handleShowConfirm);
        };
    }, []);

    if (!isLoggedIn() || isLoginPage) return null;

    const user = getCurrentUser();
    // Hide floating button for Admin and HQ roles as they'll have it in the header
    const hideFloating = user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER" || user?.role === "COUNTER" || user?.role === "KITCHEN";

    return (
        <>
            {!hideFloating && (
                <div className="fixed top-3 right-4 z-[100] no-print flex items-center gap-2">
                    <button
                        onClick={() => setShowChangePassword(true)}
                        className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-white border border-slate-100 hover:bg-slate-50 transition-all group shadow-none"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}

            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />


            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl max-w-[320px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-slate-800">Sign Out?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-slate-500">
                            Are you sure you want to log out of your session?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 sm:space-x-0">
                        <AlertDialogCancel className="flex-1 rounded-xl border-slate-100 font-bold h-11">No</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => logout()}
                            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 font-bold h-11"
                        >
                            Sign Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
