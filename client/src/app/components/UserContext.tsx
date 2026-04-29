import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import type { User } from "../types/user";
import { getVisitsDataSourceMode } from "../visits/visitSourceConfig";
import { getMockUser } from "../user/mockUserData";
import { loadUser } from "../user/loadUser";

export type { User } from "../types/user";

interface UserContextType {
    user: User;
    userLoading: boolean;
    userError: string | null;
    setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const isApi = getVisitsDataSourceMode() === "api";

    const [user, setUser] = useState<User>(() => getMockUser());
    const [userLoading, setUserLoading] = useState(isApi);
    const [userError, setUserError] = useState<string | null>(null);

    useEffect(() => {
        if (!isApi) {
            setUser(getMockUser());
            setUserLoading(false);
            setUserError(null);
            return;
        }

        let cancelled = false;
        setUserLoading(true);
        setUserError(null);

        loadUser()
            .then((u) => {
                if (!cancelled) setUser(u);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setUser(getMockUser());
                    setUserError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load profile",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setUserLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isApi]);

    return (
        <UserContext.Provider
            value={{ user, userLoading, userError, setUser }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
