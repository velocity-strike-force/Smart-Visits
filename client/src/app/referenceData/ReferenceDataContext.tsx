import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { getVisitsDataSourceMode } from "../visits/visitSourceConfig";
import {
    fallbackReferenceData,
    loadReferenceDataFromApi,
    type CustomerReference,
    type ReferenceData,
} from "./referenceDataApi";

interface ReferenceDataContextValue {
    referenceData: ReferenceData;
    referenceDataLoading: boolean;
    referenceDataError: string | null;
    customerOptions: CustomerReference[];
    productLineOptions: string[];
    domainOptions: string[];
    roleOptions: string[];
}

const ReferenceDataContext = createContext<
    ReferenceDataContextValue | undefined
>(undefined);

function sortBySortOrderThenName<T extends { sortOrder?: number; name: string }>(
    rows: T[],
): T[] {
    return [...rows].sort((a, b) => {
        const sortDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        return sortDelta || a.name.localeCompare(b.name);
    });
}

function uniqueNames(rows: Array<{ name: string }>): string[] {
    return [...new Set(rows.map((row) => row.name).filter(Boolean))];
}

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
    const isApi = getVisitsDataSourceMode() === "api";
    const [referenceData, setReferenceData] = useState<ReferenceData>(
        fallbackReferenceData,
    );
    const [referenceDataLoading, setReferenceDataLoading] = useState(isApi);
    const [referenceDataError, setReferenceDataError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        if (!isApi) {
            setReferenceData(fallbackReferenceData);
            setReferenceDataLoading(false);
            setReferenceDataError(null);
            return;
        }

        let cancelled = false;
        setReferenceDataLoading(true);
        setReferenceDataError(null);

        loadReferenceDataFromApi()
            .then((data) => {
                if (!cancelled) setReferenceData(data);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setReferenceData(fallbackReferenceData);
                    setReferenceDataError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load reference data",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setReferenceDataLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isApi]);

    const value = useMemo<ReferenceDataContextValue>(() => {
        const sortedProductLines = sortBySortOrderThenName(
            referenceData.productLines.filter((line) => line.isActive !== false),
        );
        const sortedDomains = sortBySortOrderThenName(referenceData.domains);
        const sortedRoles = sortBySortOrderThenName(referenceData.roles);
        const customerOptions = [...referenceData.customers].sort((a, b) =>
            a.customerName.localeCompare(b.customerName),
        );

        return {
            referenceData,
            referenceDataLoading,
            referenceDataError,
            customerOptions,
            productLineOptions: uniqueNames(sortedProductLines),
            domainOptions: uniqueNames(sortedDomains),
            roleOptions: uniqueNames(sortedRoles),
        };
    }, [referenceData, referenceDataError, referenceDataLoading]);

    return (
        <ReferenceDataContext.Provider value={value}>
            {children}
        </ReferenceDataContext.Provider>
    );
}

export function useReferenceData() {
    const context = useContext(ReferenceDataContext);
    if (context === undefined) {
        throw new Error(
            "useReferenceData must be used within a ReferenceDataProvider",
        );
    }
    return context;
}
