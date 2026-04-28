import { useMemo, useState } from "react";
import Typeahead from "./Typeahead";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useVisits } from "./VisitsContext";

interface CustomerVisitStat {
    name: string;
    visits: number;
    arr: number;
    lastVisit: Date;
}

const getCustomerVisitStats = (
    visits: ReturnType<typeof useVisits>["visits"],
) => {
    const statsByCustomer = new Map<string, CustomerVisitStat>();

    visits.forEach((visit) => {
        const existing = statsByCustomer.get(visit.customer);

        if (!existing) {
            statsByCustomer.set(visit.customer, {
                name: visit.customer,
                visits: 1,
                arr: visit.arr,
                lastVisit: visit.date,
            });
            return;
        }

        statsByCustomer.set(visit.customer, {
            name: existing.name,
            visits: existing.visits + 1,
            arr: Math.max(existing.arr, visit.arr),
            lastVisit:
                existing.lastVisit > visit.date
                    ? existing.lastVisit
                    : visit.date,
        });
    });

    return [...statsByCustomer.values()];
};

export default function Analytics() {
    const navigate = useNavigate();
    const { visits } = useVisits();
    const [dateRange, setDateRange] = useState("ytd");
    const [selectedProductLines, setSelectedProductLines] = useState<string[]>(
        [],
    );

    const availableProductLines = useMemo(
        () => [...new Set(visits.map((visit) => visit.productLine))].sort(),
        [visits],
    );

    const filteredVisits = useMemo(() => {
        if (selectedProductLines.length === 0) {
            return visits;
        }

        return visits.filter((visit) =>
            selectedProductLines.includes(visit.productLine),
        );
    }, [selectedProductLines, visits]);

    const topCustomersData = useMemo(
        () =>
            getCustomerVisitStats(filteredVisits)
                .sort((a, b) => b.visits - a.visits)
                .slice(0, 5)
                .map((customer) => ({
                    name: customer.name,
                    visits: customer.visits,
                })),
        [filteredVisits],
    );

    const topSalesRepsData = useMemo(() => {
        const repCounts = new Map<string, number>();

        filteredVisits.forEach((visit) => {
            repCounts.set(
                visit.salesRep,
                (repCounts.get(visit.salesRep) ?? 0) + 1,
            );
        });

        return [...repCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, visits]) => ({ name, visits }));
    }, [filteredVisits]);

    const leastVisitedCustomers = useMemo(() => {
        return getCustomerVisitStats(filteredVisits)
            .sort((a, b) => a.visits - b.visits)
            .slice(0, 3)
            .map((customer) => ({
                name: customer.name,
                lastVisit: format(customer.lastVisit, "MMM dd, yyyy"),
                arr: customer.arr,
            }));
    }, [filteredVisits]);

    const managerReports = [
        { manager: "Jennifer Wilson", directReports: 5, totalVisits: 32 },
        { manager: "Robert Taylor", directReports: 4, totalVisits: 28 },
        { manager: "Lisa Anderson", directReports: 6, totalVisits: 41 },
    ];

    const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    const uniqueCustomers = new Set(
        filteredVisits.map((visit) => visit.customer),
    );
    const activeSalesReps = new Set(
        filteredVisits.map((visit) => visit.salesRep),
    );

    const toggleProductLine = (line: string) => {
        setSelectedProductLines((prev) =>
            prev.includes(line)
                ? prev.filter((value) => value !== line)
                : [...prev, line],
        );
    };

    return (
        <div className="flex-1 bg-gray-50 overflow-auto">
            <div className="bg-white border-b px-8 py-6">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl">Analytics Dashboard</h1>
                    <div className="flex items-start gap-3">
                        <div className="px-4 py-3 border rounded-lg min-w-[260px] bg-white">
                            <div className="text-sm text-gray-600 mb-2">
                                Product Lines
                            </div>
                            <div className="space-y-1 max-h-28 overflow-auto">
                                {availableProductLines.map((line) => (
                                    <label
                                        key={line}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedProductLines.includes(
                                                line,
                                            )}
                                            onChange={() =>
                                                toggleProductLine(line)
                                            }
                                            className="rounded"
                                        />
                                        {line}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Typeahead
                            label="Date Range"
                            placeholder="Select range…"
                            options={[
                                "Month to Date",
                                "Quarter to Date",
                                "Year to Date",
                                "Custom Range",
                            ]}
                            value={
                                dateRange === "mtd"
                                    ? "Month to Date"
                                    : dateRange === "qtd"
                                      ? "Quarter to Date"
                                      : dateRange === "ytd"
                                        ? "Year to Date"
                                        : "Custom Range"
                            }
                            onChange={(v) => {
                                const map: Record<string, string> = {
                                    "Month to Date": "mtd",
                                    "Quarter to Date": "qtd",
                                    "Year to Date": "ytd",
                                    "Custom Range": "custom",
                                };
                                setDateRange(map[v] ?? "ytd");
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border p-6">
                        <div className="text-sm text-gray-600 mb-1">
                            Total Visits
                        </div>
                        <div className="text-3xl">{filteredVisits.length}</div>
                        <div className="text-sm text-green-600 mt-2">
                            ↑ 23% vs last period
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                        <div className="text-sm text-gray-600 mb-1">
                            Unique Customers
                        </div>
                        <div className="text-3xl">{uniqueCustomers.size}</div>
                        <div className="text-sm text-green-600 mt-2">
                            ↑ 12% vs last period
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-6">
                        <div className="text-sm text-gray-600 mb-1">
                            Active Sales Reps
                        </div>
                        <div className="text-3xl">{activeSalesReps.size}</div>
                        <div className="text-sm text-gray-600 mt-2">
                            → No change
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="mb-4">Top Customers by Visit Count</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCustomersData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="visits" radius={[8, 8, 0, 0]}>
                                    {topCustomersData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="mb-4">Top Sales Reps by Visit Count</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topSalesRepsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="visits"
                                    fill="#3B82F6"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                    <h2 className="mb-4">Manager Reports</h2>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">Manager</th>
                                <th className="px-4 py-3 text-left">
                                    Direct Reports
                                </th>
                                <th className="px-4 py-3 text-left">
                                    Total Visits
                                </th>
                                <th className="px-4 py-3 text-left">
                                    Avg Visits per Rep
                                </th>
                                <th className="px-4 py-3 text-left"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {managerReports.map((report, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        {report.manager}
                                    </td>
                                    <td className="px-4 py-3">
                                        {report.directReports}
                                    </td>
                                    <td className="px-4 py-3">
                                        {report.totalVisits}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(
                                            report.totalVisits /
                                            report.directReports
                                        ).toFixed(1)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button className="text-red-600 hover:text-red-700 text-sm">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-lg border p-6">
                    <h2 className="mb-4">Least Visited Customers</h2>
                    <div className="space-y-3">
                        {leastVisitedCustomers.map((customer, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                            >
                                <div>
                                    <div>{customer.name}</div>
                                    <div className="text-sm text-gray-600">
                                        Last visit: {customer.lastVisit}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">
                                        ARR
                                    </div>
                                    <div>${customer.arr.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
