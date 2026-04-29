import { Suspense } from "react";
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Users, Briefcase, MessageSquare } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import AccountSettingsModal from "./AccountSettingsModal";
import NotificationsModal from "./NotificationsModal";
import { QueryErrorBoundary } from "./QueryErrorBoundary";
import { useUser } from "./UserContext";
import { VisitsProvider } from "./VisitsContext";

export function RouteLoadingFallback({
    pathname,
    role,
}: {
    pathname: string;
    role: "visitor" | "sales_rep";
}) {
    const isFormRoute =
        pathname.startsWith("/post-visit") ||
        pathname.startsWith("/request-visit");
    const isListRoute =
        pathname.startsWith("/feedback") ||
        pathname.startsWith("/visit-requests") ||
        pathname.startsWith("/analytics");

    if (isFormRoute) {
        return (
            <div
                data-testid="fallback-form"
                className="flex-1 bg-gray-50 p-8 animate-pulse"
            >
                <div className="max-w-4xl mx-auto bg-white rounded-lg border p-6 space-y-5">
                    <div className="h-8 w-48 rounded bg-gray-200" />
                    <div className="flex justify-end">
                        <div
                            data-testid="fallback-role-action"
                            className={`h-9 rounded-md bg-gray-100 ${role === "sales_rep" ? "w-28" : "w-32"}`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 rounded bg-gray-100" />
                        <div className="h-10 rounded bg-gray-100" />
                        <div className="h-10 rounded bg-gray-100" />
                        <div className="h-10 rounded bg-gray-100" />
                    </div>
                    <div className="h-10 rounded bg-gray-100" />
                    <div className="h-10 rounded bg-gray-100" />
                    <div className="h-28 rounded bg-gray-100" />
                    <div className="flex justify-end gap-3">
                        <div className="h-10 w-24 rounded bg-gray-100" />
                        <div className="h-10 w-28 rounded bg-gray-200" />
                    </div>
                </div>
            </div>
        );
    }

    if (isListRoute) {
        return (
            <div
                data-testid="fallback-list"
                className="flex-1 bg-gray-50 p-8 animate-pulse"
            >
                <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="px-6 py-5 border-b">
                        <div className="flex items-center justify-between gap-4">
                            <div className="h-8 w-56 rounded bg-gray-200" />
                            <div
                                data-testid="fallback-role-action"
                                className={`h-9 rounded-md bg-gray-100 ${role === "sales_rep" ? "w-40" : "w-28"}`}
                            />
                        </div>
                    </div>
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-12 rounded bg-gray-100"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            data-testid="fallback-calendar"
            className="flex-1 bg-gray-50 p-8 animate-pulse"
        >
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                            <div className="h-9 w-28 rounded-md bg-gray-200" />
                            <div className="h-9 w-24 rounded-md bg-gray-100" />
                        </div>
                        <div
                            data-testid="fallback-role-action"
                            className={`h-9 rounded-md bg-gray-100 ${role === "sales_rep" ? "w-28" : "w-24"}`}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-7 w-40 rounded bg-gray-200" />
                        <div className="flex gap-2">
                            <div className="h-8 w-20 rounded-md bg-gray-100" />
                            <div className="h-8 w-16 rounded-md bg-gray-100" />
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-7 gap-2 mb-3">
                        {Array.from({ length: 7 }).map((_, idx) => (
                            <div
                                key={`header-${idx}`}
                                className="h-5 rounded bg-gray-100"
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }).map((_, idx) => (
                            <div
                                key={`cell-${idx}`}
                                className="h-24 rounded-md border bg-gray-50"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser } = useUser();
    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleRoleSwitch = (newRole: "visitor" | "sales_rep") => {
        setUser({ ...user, role: newRole });
        navigate("/");
    };

    return (
        <>
            <div
                className={`h-screen flex flex-col ${showSettings || showNotifications ? "blur-sm" : ""}`}
            >
                <header className="bg-gray-100 border-b border-gray-300 px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="flex items-center gap-2"
                            >
                                <img
                                    src="/rfsmart_logo.png"
                                    alt="RF-SMART"
                                    className="h-6 w-auto"
                                />
                                <span className="text-lg hover:text-blue-600">
                                    Visits
                                </span>
                            </button>
                            <nav className="flex gap-1">
                                <button
                                    onClick={() => navigate("/")}
                                    className={`px-3 py-1.5 rounded-lg text-sm ${
                                        location.pathname === "/"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate("/feedback")}
                                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
                                        location.pathname.startsWith(
                                            "/feedback",
                                        )
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Feedback
                                </button>
                                {user.role === "visitor" && (
                                    <button
                                        onClick={() =>
                                            navigate("/request-visit")
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-sm ${
                                            location.pathname ===
                                            "/request-visit"
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        Request Visit
                                    </button>
                                )}
                                {user.role === "sales_rep" && (
                                    <>
                                        <button
                                            onClick={() =>
                                                navigate("/visit-requests")
                                            }
                                            className={`px-3 py-1.5 rounded-lg text-sm ${
                                                location.pathname ===
                                                "/visit-requests"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            Visit Requests
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate("/analytics")
                                            }
                                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
                                                location.pathname ===
                                                "/analytics"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                            Analytics
                                        </button>
                                    </>
                                )}
                            </nav>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => handleRoleSwitch("visitor")}
                                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
                                        user.role === "visitor"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <Users className="w-4 h-4" />
                                    Visitor
                                </button>
                                <button
                                    onClick={() =>
                                        handleRoleSwitch("sales_rep")
                                    }
                                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
                                        user.role === "sales_rep"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    Sales Rep
                                </button>
                            </div>
                            <ProfileMenu
                                onOpenSettings={() => setShowSettings(true)}
                                onOpenNotifications={() =>
                                    setShowNotifications(true)
                                }
                            />
                        </div>
                    </div>
                </header>

                <QueryErrorBoundary>
                    <Suspense
                        fallback={
                            <RouteLoadingFallback
                                pathname={location.pathname}
                                role={user.role}
                            />
                        }
                    >
                        <VisitsProvider>
                            <Outlet />
                        </VisitsProvider>
                    </Suspense>
                </QueryErrorBoundary>
            </div>

            <AccountSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
            <NotificationsModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </>
    );
}
