import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Users, Briefcase } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import AccountSettingsModal from "./AccountSettingsModal";
import NotificationsModal from "./NotificationsModal";
import { useUser } from "./UserContext";

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
                <header className="bg-white border-b px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="flex items-center gap-3"
                            >
                                <img
                                    src="/rfsmart_logo.png"
                                    alt="RF-SMART"
                                    className="h-8 w-auto"
                                />
                                <span className="text-xl hover:text-blue-600">
                                    Customer Visits
                                </span>
                            </button>
                            <nav className="flex gap-1">
                                <button
                                    onClick={() => navigate("/")}
                                    className={`px-4 py-2 rounded-lg ${
                                        location.pathname === "/"
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    Dashboard
                                </button>
                                {user.role === "visitor" && (
                                    <button
                                        onClick={() =>
                                            navigate("/request-visit")
                                        }
                                        className={`px-4 py-2 rounded-lg ${
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
                                    <button
                                        onClick={() => navigate("/analytics")}
                                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                            location.pathname === "/analytics"
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Analytics
                                    </button>
                                )}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => handleRoleSwitch("visitor")}
                                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
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
                                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
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

                <Outlet />
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
