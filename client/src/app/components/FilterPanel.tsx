import { useState, useMemo } from "react";
import { Slider } from "./ui/slider";
import RequiredLabel from "./RequiredLabel";
import { Switch } from "./ui/switch";

interface Visit {
    id: string;
    title: string;
    customer: string;
    date: Date;
    productLine: string;
    location: string;
    arr: number;
    salesRep: string;
    domain: string;
    isDraft?: boolean;
}

export interface FilterState {
    productLines: string[];
    location: string;
    arrMin: string;
    arrMax: string;
    salesRep: string;
    domain: string;
    customer: string;
    keyAccounts: boolean;
}

const defaultFilters: FilterState = {
    productLines: [],
    location: "",
    arrMin: "",
    arrMax: "",
    salesRep: "",
    domain: "",
    customer: "",
    keyAccounts: false,
};

const EMPTY_PRODUCT_LINE_LABEL = "Unspecified";

interface FilterPanelProps {
    visits: Visit[];
    filters?: FilterState;
    onChange?: (filters: FilterState) => void;
}

export default function FilterPanel({
    visits,
    filters: controlledFilters,
    onChange,
}: FilterPanelProps) {
    const [internalFilters, setInternalFilters] =
        useState<FilterState>(defaultFilters);
    const filters = controlledFilters ?? internalFilters;

    const setFilters = (nextFilters: FilterState) => {
        if (onChange) {
            onChange(nextFilters);
            return;
        }

        setInternalFilters(nextFilters);
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value);

    const productLineOptions = useMemo(
        () => [...new Set(visits.map((v) => v.productLine))].sort(),
        [visits],
    );

    const domainOptions = useMemo(
        () => [...new Set(visits.map((v) => v.domain).filter(Boolean))].sort(),
        [visits],
    );

    const locationOptions = useMemo(
        () =>
            [...new Set(visits.map((v) => v.location).filter(Boolean))].sort(),
        [visits],
    );

    const salesRepOptions = useMemo(
        () =>
            [...new Set(visits.map((v) => v.salesRep).filter(Boolean))].sort(),
        [visits],
    );

    const arrBounds = useMemo(() => {
        if (visits.length === 0) {
            return { min: 0, max: 10000 };
        }

        const values = visits.map((v) => v.arr);
        const min = Math.floor(Math.min(...values) / 10000) * 10000;
        const max = Math.ceil(Math.max(...values) / 10000) * 10000;

        return {
            min,
            max: max > min ? max : min + 10000,
        };
    }, [visits]);

    const arrRange = [
        filters.arrMin === "" ? arrBounds.min : Number(filters.arrMin),
        filters.arrMax === "" ? arrBounds.max : Number(filters.arrMax),
    ];

    const handleProductLineToggle = (line: string) => {
        setFilters({
            ...filters,
            productLines: filters.productLines.includes(line)
                ? filters.productLines.filter((l) => l !== line)
                : [...filters.productLines, line],
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <RequiredLabel className="block mb-2">
                        Product Line
                    </RequiredLabel>
                    <div className="space-y-1">
                        {productLineOptions.length > 0 ? (
                            productLineOptions.map((line) => (
                                <label
                                    key={line}
                                    className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm"
                                >
                                    <span>
                                        {line || EMPTY_PRODUCT_LINE_LABEL}
                                    </span>
                                    <Switch
                                        checked={filters.productLines.includes(
                                            line,
                                        )}
                                        onCheckedChange={() =>
                                            handleProductLineToggle(line)
                                        }
                                    />
                                </label>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">
                                No product lines available
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <RequiredLabel className="block mb-2">
                        Location
                    </RequiredLabel>
                    <select
                        value={filters.location}
                        onChange={(e) =>
                            setFilters({ ...filters, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">All Locations</option>
                        {locationOptions.map((location) => (
                            <option key={location} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>

                    <RequiredLabel className="block mb-2 mt-4">
                        Domain
                    </RequiredLabel>
                    <select
                        value={filters.domain}
                        onChange={(e) =>
                            setFilters({ ...filters, domain: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">All Domains</option>
                        {domainOptions.map((domain) => (
                            <option key={domain} value={domain}>
                                {domain}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <RequiredLabel className="block mb-2">
                        ARR Range
                    </RequiredLabel>
                    <div className="space-y-3 rounded-lg border px-3 py-4">
                        <Slider
                            min={arrBounds.min}
                            max={arrBounds.max}
                            step={10000}
                            minStepsBetweenThumbs={1}
                            value={arrRange}
                            onValueChange={(value) =>
                                setFilters({
                                    ...filters,
                                    arrMin: String(value[0]),
                                    arrMax: String(value[1]),
                                })
                            }
                            disabled={visits.length === 0}
                        />

                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{formatCurrency(arrRange[0])}</span>
                            <span>{formatCurrency(arrRange[1])}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <RequiredLabel className="block mb-2">
                        Sales Rep
                    </RequiredLabel>
                    <select
                        value={filters.salesRep}
                        onChange={(e) =>
                            setFilters({ ...filters, salesRep: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">All Sales Reps</option>
                        {salesRepOptions.map((rep) => (
                            <option key={rep} value={rep}>
                                {rep}
                            </option>
                        ))}
                    </select>

                    <RequiredLabel className="block mb-2 mt-4">
                        Customer
                    </RequiredLabel>
                    <input
                        type="text"
                        placeholder="Search customer"
                        value={filters.customer}
                        onChange={(e) =>
                            setFilters({ ...filters, customer: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                    />

                    <RequiredLabel className="mt-4 flex items-center justify-between gap-3 rounded-lg p-3 text-sm">
                        <span>Key Accounts Only</span>
                        <Switch
                            checked={filters.keyAccounts}
                            onCheckedChange={(checked) =>
                                setFilters({
                                    ...filters,
                                    keyAccounts: checked,
                                })
                            }
                        />
                    </RequiredLabel>
                </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
                <button
                    onClick={() => setFilters(defaultFilters)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
}
