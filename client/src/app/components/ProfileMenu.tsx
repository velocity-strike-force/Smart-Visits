import { useState, useRef, useEffect } from "react";
import { User, Settings, Bell } from "lucide-react";
import { useUser } from "./UserContext";

interface ProfileMenuProps {
    onOpenSettings: () => void;
    onOpenNotifications: () => void;
}

export default function ProfileMenu({
    onOpenSettings,
    onOpenNotifications,
}: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
            >
                <User className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <div className="px-4 py-3 border-b">
                        <div>{user.name}</div>
                        <div className="text-sm text-gray-600">
                            {user.email}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onOpenSettings();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                        <Settings className="w-4 h-4" />
                        Preferences
                    </button>
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onOpenNotifications();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                        <Bell className="w-4 h-4" />
                        Notifications
                    </button>
                </div>
            )}
        </div>
    );
}
