import { createContext, useContext, useState, ReactNode } from "react";

interface User {
    name: string;
    email: string;
    role: "visitor" | "sales_rep";
}

interface UserContextType {
    user: User;
    setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>({
        name: "Sonny Antunes",
        email: "sonny.antunes@rfsmart.com",
        role: "visitor",
    });

    return (
        <UserContext.Provider value={{ user, setUser }}>
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
