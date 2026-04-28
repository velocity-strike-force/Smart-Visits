import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Sparkles, Boxes, Users } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "./UserContext";
import { mockVisitRequests } from "./visitRequestsData";

export default function VisitRequests() {
    const navigate = useNavigate();
    const { user } = useUser();

    const topCustomer = useMemo(() => {
        const counts = new Map<string, number>();
        mockVisitRequests.forEach((request) => {
            counts.set(
                request.customer,
                (counts.get(request.customer) ?? 0) + 1,
            );
        });

        return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    }, []);

    const topProductLine = useMemo(() => {
        const counts = new Map<string, number>();
        mockVisitRequests.forEach((request) => {
            counts.set(
                request.productLine,
                (counts.get(request.productLine) ?? 0) + 1,
            );
        });

        return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    }, []);

    if (user.role !== "sales_rep") {
        return (
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white border rounded-lg p-8 max-w-md">
                    <h2 className="text-2xl mb-3">Sales Rep Only Page</h2>
                    <p className="text-gray-600 mb-6">
                        Visit Requests are available only for sales reps.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

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
                <h1 className="text-2xl">Visit Requests</h1>
                <p className="text-gray-600 mt-1 max-w-3xl">
                    This is your pulse check on what employees want to
                    experience. Use demand patterns to prioritize customers and
                    product lines in your upcoming visit calendar.
                </p>
            </div>

            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-lg p-5">
                        <div className="text-sm text-gray-500 mb-1">
                            Total Requests
                        </div>
                        <div className="text-2xl flex items-center gap-2">
                            <Users className="w-5 h-5 text-red-600" />
                            {mockVisitRequests.length}
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg p-5">
                        <div className="text-sm text-gray-500 mb-1">
                            Top Customer Interest
                        </div>
                        <div className="text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            {topCustomer
                                ? `${topCustomer[0]} (${topCustomer[1]})`
                                : "N/A"}
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg p-5">
                        <div className="text-sm text-gray-500 mb-1">
                            Top Product Line
                        </div>
                        <div className="text-lg flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-indigo-600" />
                            {topProductLine
                                ? `${topProductLine[0]} (${topProductLine[1]})`
                                : "N/A"}
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h2 className="text-lg">Employee Visit Demand</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        Product Line
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        Preferred Timing
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockVisitRequests.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="border-b align-top"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {format(
                                                new Date(request.submittedAt),
                                                "MMM dd, yyyy",
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>{request.submittedBy}</div>
                                            <div className="text-xs text-gray-500">
                                                {request.department}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {request.customer}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                {request.productLine}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {request.preferredTiming}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                                            {request.notes}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
