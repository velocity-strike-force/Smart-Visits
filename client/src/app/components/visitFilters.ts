export interface VisitFilters {
    productLines: string[];
    location: string;
    arrMin: string;
    arrMax: string;
    salesRep: string;
    domain: string;
    customer: string;
    keyAccounts: boolean;
}

export const DEFAULT_VISIT_FILTERS: VisitFilters = {
    productLines: [],
    location: "",
    arrMin: "",
    arrMax: "",
    salesRep: "",
    domain: "",
    customer: "",
    keyAccounts: false,
};
