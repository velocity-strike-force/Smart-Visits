import { useEffect, useRef, useState } from "react";
import {
    Calendar,
    List,
    Filter,
    Plus,
    ChevronLeft,
    ChevronRight,
    Star,
    X,
    ExternalLink,
    CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
} from "date-fns";
import FilterPanel from "./FilterPanel";
import { useUser } from "./UserContext";
import { createDefaultVisitFilters, type VisitFilters } from "./visitFilters";

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
    isKeyAccount?: boolean;
    isDraft?: boolean;
    postVisitRecordCount?: number;
    capacity: number;
    currentAttendees: number;
}

const mockVisits: Visit[] = [
    {
        id: "1",
        title: "Quarterly Review",
        customer: "Acme Corp",
        date: new Date(2026, 3, 10),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 250000,
        salesRep: "John Smith",
        domain: "Manufacturing",
        isKeyAccount: true,
        postVisitRecordCount: 2,
        capacity: 10,
        currentAttendees: 3,
    },
    {
        id: "2",
        title: "Product Demo",
        customer: "TechStart Inc",
        date: new Date(2026, 3, 15),
        productLine: "Oracle Cloud",
        location: "Miami, FL",
        arr: 150000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        isKeyAccount: false,
        isDraft: true,
        capacity: 8,
        currentAttendees: 0,
    },
    {
        id: "5",
        title: "Executive Briefing",
        customer: "Sunrise Health",
        date: new Date(2026, 3, 15),
        productLine: "NetSuite",
        location: "Miami, FL",
        arr: 320000,
        salesRep: "Alex Rivera",
        domain: "Outbound",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 6,
        currentAttendees: 4,
    },
    {
        id: "6",
        title: "Architecture Workshop",
        customer: "Bluewave Energy",
        date: new Date(2026, 3, 15),
        productLine: "Oracle Cloud",
        location: "Miami, FL",
        arr: 410000,
        salesRep: "Priya Patel",
        domain: "Counting",
        isKeyAccount: false,
        postVisitRecordCount: 1,
        capacity: 5,
        currentAttendees: 5,
    },
    {
        id: "3",
        title: "Implementation Review",
        customer: "Global Logistics",
        date: new Date(2026, 3, 22),
        productLine: "TMS",
        location: "Tampa, FL",
        arr: 500000,
        salesRep: "Mike Johnson",
        domain: "Manufacturing",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 5,
        currentAttendees: 5,
    },
    {
        id: "4",
        title: "Training Session",
        customer: "RetailMax",
        date: new Date(2026, 3, 28),
        productLine: "Shipping",
        location: "Orlando, FL",
        arr: 180000,
        salesRep: "Sarah Williams",
        domain: "Inbound",
        isKeyAccount: false,
        capacity: 12,
        currentAttendees: 8,
    },
    {
        id: "7",
        title: "Post Go-Live Review",
        customer: "Northstar Foods",
        date: new Date(2026, 3, 28),
        productLine: "TMS",
        location: "Orlando, FL",
        arr: 275000,
        salesRep: "Chris Morgan",
        domain: "Outbound",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 10,
        currentAttendees: 2,
    },
    {
        id: "8",
        title: "Demand Planning Strategy Session",
        customer: "Summit Brands",
        date: new Date(2026, 3, 17),
        productLine: "Demand Planning",
        location: "Atlanta, GA",
        arr: 360000,
        salesRep: "Priya Patel",
        domain: "Counting",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 9,
        currentAttendees: 5,
    },
    {
        id: "9",
        title: "Warehouse Mobility Deep Dive",
        customer: "Vertex Distribution",
        date: new Date(2026, 3, 17),
        productLine: "AX",
        location: "Dallas, TX",
        arr: 210000,
        salesRep: "Alex Rivera",
        domain: "Inbound",
        isKeyAccount: false,
        postVisitRecordCount: 1,
        capacity: 7,
        currentAttendees: 3,
    },
    {
        id: "10",
        title: "Outbound Throughput Workshop",
        customer: "Globex Industries",
        date: new Date(2026, 3, 22),
        productLine: "TMS",
        location: "Tampa, FL",
        arr: 460000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 8,
        currentAttendees: 6,
    },
    {
        id: "11",
        title: "Counting Process Calibration",
        customer: "Metro Retail Group",
        date: new Date(2026, 3, 28),
        productLine: "Shipping",
        location: "Charlotte, NC",
        arr: 195000,
        salesRep: "Sarah Williams",
        domain: "Counting",
        isKeyAccount: false,
        capacity: 10,
        currentAttendees: 4,
    },
    {
        id: "12",
        title: "May Launch Planning",
        customer: "Harbor Wholesale",
        date: new Date(2026, 4, 6),
        productLine: "Oracle Cloud",
        location: "Savannah, GA",
        arr: 205000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        isKeyAccount: false,
        postVisitRecordCount: 1,
        capacity: 8,
        currentAttendees: 3,
    },
    {
        id: "13",
        title: "Factory Floor Alignment",
        customer: "Acme Corp",
        date: new Date(2026, 4, 14),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 320000,
        salesRep: "John Smith",
        domain: "Manufacturing",
        isKeyAccount: true,
        capacity: 10,
        currentAttendees: 7,
    },
    {
        id: "14",
        title: "Outbound Routing Roundtable",
        customer: "Globex Industries",
        date: new Date(2026, 4, 28),
        productLine: "TMS",
        location: "Atlanta, GA",
        arr: 460000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        isKeyAccount: true,
        capacity: 9,
        currentAttendees: 6,
    },
    {
        id: "15",
        title: "June Forecast Workshop",
        customer: "Summit Brands",
        date: new Date(2026, 5, 4),
        productLine: "Demand Planning",
        location: "Atlanta, GA",
        arr: 365000,
        salesRep: "Priya Patel",
        domain: "Counting",
        isKeyAccount: true,
        capacity: 9,
        currentAttendees: 4,
    },
    {
        id: "16",
        title: "Warehouse Mobility Review",
        customer: "Vertex Distribution",
        date: new Date(2026, 5, 19),
        productLine: "AX",
        location: "Dallas, TX",
        arr: 215000,
        salesRep: "Alex Rivera",
        domain: "Inbound",
        isKeyAccount: false,
        capacity: 8,
        currentAttendees: 2,
    },
    {
        id: "17",
        title: "Late-April Customer Readout",
        customer: "Bluewave Energy",
        date: new Date(2026, 3, 29),
        productLine: "NetSuite",
        location: "Houston, TX",
        arr: 240000,
        salesRep: "Alex Rivera",
        domain: "Manufacturing",
        isKeyAccount: false,
        capacity: 8,
        currentAttendees: 3,
    },
    {
        id: "18",
        title: "May Throughput Assessment",
        customer: "Metro Retail Group",
        date: new Date(2026, 4, 21),
        productLine: "Shipping",
        location: "Charlotte, NC",
        arr: 195000,
        salesRep: "Sarah Williams",
        domain: "Counting",
        isKeyAccount: false,
        postVisitRecordCount: 1,
        capacity: 10,
        currentAttendees: 5,
    },
    {
        id: "19",
        title: "June Operations Roundtable",
        customer: "Globex Industries",
        date: new Date(2026, 5, 24),
        productLine: "TMS",
        location: "Atlanta, GA",
        arr: 460000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        isKeyAccount: true,
        capacity: 9,
        currentAttendees: 6,
    },
    {
        id: "20",
        title: "May Integration Design Review",
        customer: "Northstar Foods",
        date: new Date(2026, 4, 5),
        productLine: "Oracle Cloud",
        location: "Nashville, TN",
        arr: 275000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        isKeyAccount: false,
        capacity: 8,
        currentAttendees: 3,
    },
    {
        id: "21",
        title: "May Site Expansion Debrief",
        customer: "Bluewave Energy",
        date: new Date(2026, 4, 12),
        productLine: "NetSuite",
        location: "Houston, TX",
        arr: 240000,
        salesRep: "Alex Rivera",
        domain: "Manufacturing",
        isKeyAccount: false,
        capacity: 7,
        currentAttendees: 4,
    },
    {
        id: "22",
        title: "May Forecast Validation",
        customer: "Summit Brands",
        date: new Date(2026, 4, 20),
        productLine: "Demand Planning",
        location: "Atlanta, GA",
        arr: 365000,
        salesRep: "Priya Patel",
        domain: "Counting",
        isKeyAccount: true,
        capacity: 9,
        currentAttendees: 6,
    },
    {
        id: "23",
        title: "May Distribution Workflow Audit",
        customer: "Vertex Distribution",
        date: new Date(2026, 4, 26),
        productLine: "AX",
        location: "Dallas, TX",
        arr: 215000,
        salesRep: "Alex Rivera",
        domain: "Inbound",
        isKeyAccount: false,
        capacity: 8,
        currentAttendees: 5,
    },
    {
        id: "24",
        title: "June Kickoff Planning Session",
        customer: "Harbor Wholesale",
        date: new Date(2026, 5, 2),
        productLine: "Oracle Cloud",
        location: "Savannah, GA",
        arr: 205000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        isKeyAccount: false,
        capacity: 8,
        currentAttendees: 4,
    },
    {
        id: "25",
        title: "June Factory Readiness Workshop",
        customer: "Acme Corp",
        date: new Date(2026, 5, 9),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 320000,
        salesRep: "John Smith",
        domain: "Manufacturing",
        isKeyAccount: true,
        capacity: 10,
        currentAttendees: 7,
    },
    {
        id: "26",
        title: "June Mid-Month Throughput Check",
        customer: "Metro Retail Group",
        date: new Date(2026, 5, 18),
        productLine: "Shipping",
        location: "Charlotte, NC",
        arr: 195000,
        salesRep: "Sarah Williams",
        domain: "Counting",
        isKeyAccount: false,
        capacity: 10,
        currentAttendees: 5,
    },
    {
        id: "27",
        title: "June Route Optimization Review",
        customer: "Globex Industries",
        date: new Date(2026, 5, 25),
        productLine: "TMS",
        location: "Atlanta, GA",
        arr: 460000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        isKeyAccount: true,
        capacity: 9,
        currentAttendees: 7,
    },
    {
        id: "28",
        title: "April Go-Live Readiness Check",
        customer: "Acme Corp",
        date: new Date(2026, 3, 1),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 315000,
        salesRep: "John Smith",
        domain: "Manufacturing",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 10,
        currentAttendees: 6,
    },
    {
        id: "29",
        title: "April Inventory Alignment Session",
        customer: "Northstar Foods",
        date: new Date(2026, 3, 2),
        productLine: "Oracle Cloud",
        location: "Nashville, TN",
        arr: 278000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        isKeyAccount: false,
        postVisitRecordCount: 1,
        capacity: 8,
        currentAttendees: 4,
    },
    {
        id: "30",
        title: "April Network Planning Kickoff",
        customer: "Globex Industries",
        date: new Date(2026, 3, 6),
        productLine: "TMS",
        location: "Atlanta, GA",
        arr: 462000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        isKeyAccount: true,
        postVisitRecordCount: 1,
        capacity: 9,
        currentAttendees: 5,
    },
];

const getProductLineTheme = (productLine: string) => {
    const normalized = productLine.toLowerCase();

    if (normalized.includes("netsuite")) {
        return {
            calendarCard: "bg-emerald-100 text-emerald-800",
            badge: "bg-emerald-100 text-emerald-800",
            subtleText: "text-emerald-700",
        };
    }

    if (normalized.includes("oracle")) {
        return {
            calendarCard: "bg-indigo-100 text-indigo-800",
            badge: "bg-indigo-100 text-indigo-800",
            subtleText: "text-indigo-700",
        };
    }

    if (normalized.includes("tms")) {
        return {
            calendarCard: "bg-teal-100 text-teal-800",
            badge: "bg-teal-100 text-teal-800",
            subtleText: "text-teal-700",
        };
    }

    if (normalized.includes("shipping")) {
        return {
            calendarCard: "bg-amber-100 text-amber-800",
            badge: "bg-amber-100 text-amber-800",
            subtleText: "text-amber-700",
        };
    }

    if (normalized.includes("demand")) {
        return {
            calendarCard: "bg-fuchsia-100 text-fuchsia-800",
            badge: "bg-fuchsia-100 text-fuchsia-800",
            subtleText: "text-fuchsia-700",
        };
    }

    if (normalized.includes("ax")) {
        return {
            calendarCard: "bg-cyan-100 text-cyan-800",
            badge: "bg-cyan-100 text-cyan-800",
            subtleText: "text-cyan-700",
        };
    }

    return {
        calendarCard: "bg-blue-100 text-blue-800",
        badge: "bg-blue-100 text-blue-800",
        subtleText: "text-blue-700",
    };
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showFilters, setShowFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<VisitFilters>(
        createDefaultVisitFilters(),
    );
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dayModalFocusIndex, setDayModalFocusIndex] = useState(0);
    const dayModalVisitRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [visits] = useState<Visit[]>(mockVisits);

    const baseVisits =
        user.role === "visitor" ? visits.filter((v) => !v.isDraft) : visits;

    const filteredVisits = baseVisits.filter((visit) => {
        const minArr =
            appliedFilters.arrMin === ""
                ? Number.NEGATIVE_INFINITY
                : Number(appliedFilters.arrMin);
        const maxArr =
            appliedFilters.arrMax === ""
                ? Number.POSITIVE_INFINITY
                : Number(appliedFilters.arrMax);

        const matchesProductLine =
            appliedFilters.productLines.length === 0 ||
            appliedFilters.productLines.includes(visit.productLine);
        const matchesLocation =
            appliedFilters.location === "" ||
            visit.location === appliedFilters.location;
        const matchesDomain =
            appliedFilters.domain === "" ||
            visit.domain === appliedFilters.domain;
        const matchesSalesRep =
            appliedFilters.salesRep === "" ||
            visit.salesRep === appliedFilters.salesRep;
        const matchesCustomer =
            appliedFilters.customer.trim() === "" ||
            visit.customer
                .toLowerCase()
                .includes(appliedFilters.customer.toLowerCase().trim());
        const matchesArr = visit.arr >= minArr && visit.arr <= maxArr;
        const matchesKeyAccount =
            !appliedFilters.keyAccounts || Boolean(visit.isKeyAccount);

        return (
            matchesProductLine &&
            matchesLocation &&
            matchesDomain &&
            matchesSalesRep &&
            matchesCustomer &&
            matchesArr &&
            matchesKeyAccount
        );
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const daysInMonth = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const getVisitsForDay = (day: Date) => {
        return filteredVisits.filter((visit) => isSameDay(visit.date, day));
    };

    const hasPostVisitRecord = (visit: Visit) =>
        (visit.postVisitRecordCount ?? 0) > 0;

    const selectedDayVisits = selectedDay ? getVisitsForDay(selectedDay) : [];

    useEffect(() => {
        if (!selectedVisit && !selectedDay) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            if (selectedVisit) {
                setSelectedVisit(null);
                return;
            }

            if (selectedDay) {
                setSelectedDay(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedVisit, selectedDay]);

    useEffect(() => {
        if (!selectedDay || selectedDayVisits.length === 0) {
            return;
        }

        setDayModalFocusIndex(0);
    }, [selectedDay, selectedDayVisits.length]);

    useEffect(() => {
        if (!selectedDay) {
            return;
        }

        const target = dayModalVisitRefs.current[dayModalFocusIndex];
        if (target) {
            target.focus();
        }
    }, [selectedDay, dayModalFocusIndex, selectedDayVisits.length]);

    const previousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
        );
    };

    const nextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50">
            <div className="bg-white border-b px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                    viewMode === "calendar"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Calendar
                            </button>

                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                    viewMode === "list"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                <List className="w-4 h-4" />
                                List
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>

                        {user.role === "sales_rep" && (
                            <button
                                onClick={() => navigate("/post-visit")}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Post a Visit
                            </button>
                        )}
                    </div>
                </div>

                {viewMode === "calendar" && (
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={previousMonth}
                                className="px-3 py-1 border rounded hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={nextMonth}
                                className="px-3 py-1 border rounded hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto">
                {showFilters && (
                    <div className="bg-white border-b p-6">
                        <FilterPanel
                            visits={baseVisits}
                            filters={appliedFilters}
                            onChange={setAppliedFilters}
                        />
                    </div>
                )}

                <div className="p-8">
                    {viewMode === "calendar" ? (
                        <div className="bg-white rounded-lg border overflow-hidden">
                            <div className="grid grid-cols-7 border-b">
                                {[
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                ].map((day) => (
                                    <div
                                        key={day}
                                        className="px-4 py-3 text-center border-r last:border-r-0"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {daysInMonth.map((day, idx) => {
                                    const dayVisits = getVisitsForDay(day);
                                    const visibleDayVisits = dayVisits.slice(
                                        0,
                                        2,
                                    );
                                    const hiddenVisitCount =
                                        dayVisits.length -
                                        visibleDayVisits.length;

                                    return (
                                        <div
                                            key={idx}
                                            className="min-h-[120px] border-r border-b last:border-r-0 p-2 hover:bg-gray-50 cursor-pointer"
                                            onClick={() =>
                                                navigate(
                                                    `/post-visit?date=${day.toISOString()}`,
                                                )
                                            }
                                        >
                                            <div
                                                className={`mb-2 ${!isSameMonth(day, currentDate) ? "text-gray-400" : ""}`}
                                            >
                                                {format(day, "d")}
                                            </div>

                                            <div className="space-y-1">
                                                {visibleDayVisits.map(
                                                    (visit) => {
                                                        const isFull =
                                                            visit.currentAttendees >=
                                                            visit.capacity;
                                                        const productLineTheme =
                                                            getProductLineTheme(
                                                                visit.productLine,
                                                            );

                                                        return (
                                                            <div
                                                                key={visit.id}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setSelectedVisit(
                                                                        visit,
                                                                    );
                                                                }}
                                                                className={`text-xs p-2 rounded hover:opacity-90 relative cursor-pointer ${
                                                                    isFull
                                                                        ? "bg-gray-100 text-gray-600 border border-gray-200"
                                                                        : productLineTheme.calendarCard
                                                                }`}
                                                            >
                                                                <div className="truncate">
                                                                    {visit.isKeyAccount && (
                                                                        <Star className="inline-block w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                                                                    )}
                                                                    {
                                                                        visit.customer
                                                                    }
                                                                    {hasPostVisitRecord(
                                                                        visit,
                                                                    ) && (
                                                                        <CheckCircle2 className="inline-block w-3 h-3 text-green-700 ml-1" />
                                                                    )}
                                                                </div>

                                                                <div className="text-[10px] mt-1 flex items-center justify-between">
                                                                    <span>
                                                                        {
                                                                            visit.location
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            isFull
                                                                                ? "text-red-600 font-medium"
                                                                                : ""
                                                                        }
                                                                    >
                                                                        {
                                                                            visit.currentAttendees
                                                                        }
                                                                        /
                                                                        {
                                                                            visit.capacity
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {visit.isDraft &&
                                                                    user.role ===
                                                                        "sales_rep" && (
                                                                        <span className="absolute top-0 right-0 px-1 text-[10px] bg-gray-400 text-white rounded-bl">
                                                                            Draft
                                                                        </span>
                                                                    )}

                                                                {isFull && (
                                                                    <span className="absolute top-0 right-0 px-1 text-[10px] bg-red-500 text-white rounded-bl">
                                                                        Full
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    },
                                                )}

                                                {hiddenVisitCount > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDay(day);
                                                            setDayModalFocusIndex(
                                                                0,
                                                            );
                                                        }}
                                                        className="w-full text-left px-2 py-1 text-[11px] text-blue-700 bg-blue-50 rounded font-medium hover:bg-blue-100"
                                                    >
                                                        +{hiddenVisitCount} more
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                                <h2 className="text-lg">
                                    {format(currentDate, "MMMM yyyy")}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={previousMonth}
                                        className="px-3 py-1 border rounded hover:bg-white flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>

                                    <button
                                        onClick={nextMonth}
                                        className="px-3 py-1 border rounded hover:bg-white flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Product Line
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Sales Rep
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            ARR
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            Capacity
                                        </th>
                                        {user.role === "sales_rep" && (
                                            <th className="px-6 py-3 text-left">
                                                Status
                                            </th>
                                        )}
                                        {user.role === "visitor" && (
                                            <th className="px-6 py-3 text-left"></th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredVisits
                                        .filter((visit) =>
                                            isSameMonth(
                                                visit.date,
                                                currentDate,
                                            ),
                                        )
                                        .map((visit) => {
                                            const isFull =
                                                visit.currentAttendees >=
                                                visit.capacity;
                                            const spotsLeft =
                                                visit.capacity -
                                                visit.currentAttendees;
                                            const productLineTheme =
                                                getProductLineTheme(
                                                    visit.productLine,
                                                );

                                            return (
                                                <tr
                                                    key={visit.id}
                                                    onClick={() =>
                                                        navigate(
                                                            `/visit/${visit.id}`,
                                                        )
                                                    }
                                                    className="border-b hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <td className="px-6 py-4">
                                                        {format(
                                                            visit.date,
                                                            "MMM dd, yyyy",
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {visit.isKeyAccount && (
                                                            <Star className="inline-block w-4 h-4 text-amber-500 fill-amber-400 mr-1" />
                                                        )}
                                                        {visit.customer}
                                                        {hasPostVisitRecord(
                                                            visit,
                                                        ) && (
                                                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Done
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {visit.location}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs ${productLineTheme.badge}`}
                                                        >
                                                            {visit.productLine}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {visit.salesRep}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        $
                                                        {visit.arr.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={
                                                                    isFull
                                                                        ? "text-red-600 font-medium"
                                                                        : ""
                                                                }
                                                            >
                                                                {
                                                                    visit.currentAttendees
                                                                }{" "}
                                                                /{" "}
                                                                {visit.capacity}
                                                            </span>
                                                            {isFull ? (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                                                    Full
                                                                </span>
                                                            ) : (
                                                                spotsLeft <=
                                                                    3 && (
                                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                                                        {
                                                                            spotsLeft
                                                                        }{" "}
                                                                        left
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>

                                                    {user.role ===
                                                        "sales_rep" && (
                                                        <td className="px-6 py-4">
                                                            {visit.isDraft ? (
                                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                                                    Draft
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {user.role ===
                                                        "visitor" && (
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    navigate(
                                                                        `/visit/${visit.id}`,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    isFull
                                                                }
                                                                className={`px-4 py-2 rounded-lg text-sm ${
                                                                    isFull
                                                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                                                }`}
                                                            >
                                                                {isFull
                                                                    ? "Full"
                                                                    : "Join Visit"}
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedVisit && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl">
                                    {selectedVisit.isKeyAccount && (
                                        <Star className="inline-block w-5 h-5 text-amber-500 fill-amber-400 mr-2" />
                                    )}
                                    {selectedVisit.customer}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {format(
                                        selectedVisit.date,
                                        "MMMM dd, yyyy",
                                    )}
                                </p>
                                {hasPostVisitRecord(selectedVisit) && (
                                    <span className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Done (
                                        {
                                            selectedVisit.postVisitRecordCount
                                        }{" "}
                                        post-visit record
                                        {selectedVisit.postVisitRecordCount ===
                                        1
                                            ? ""
                                            : "s"}
                                        )
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedVisit(null)}
                                className="text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-500">
                                    Location
                                </div>
                                <div>{selectedVisit.location}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Company
                                </div>
                                <div>{selectedVisit.customer}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Product Line
                                </div>
                                <span
                                    className={`inline-block mt-1 px-2 py-1 rounded text-xs ${getProductLineTheme(selectedVisit.productLine).badge}`}
                                >
                                    {selectedVisit.productLine}
                                </span>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Sales Rep
                                </div>
                                <div>{selectedVisit.salesRep}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Capacity
                                </div>
                                <div>
                                    {selectedVisit.currentAttendees} /{" "}
                                    {selectedVisit.capacity}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setSelectedVisit(null)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>

                            <button
                                onClick={() =>
                                    navigate(`/visit/${selectedVisit.id}`)
                                }
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Full Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedDay && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => setSelectedDay(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (selectedDayVisits.length === 0) {
                                return;
                            }

                            const isVisitRowTarget =
                                dayModalVisitRefs.current.some(
                                    (node) => node === e.target,
                                );
                            const isModalContainerTarget =
                                e.target === e.currentTarget;
                            const shouldHandleListKeys =
                                isVisitRowTarget || isModalContainerTarget;

                            if (!shouldHandleListKeys) {
                                return;
                            }

                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setDayModalFocusIndex((idx) =>
                                    Math.min(
                                        idx + 1,
                                        selectedDayVisits.length - 1,
                                    ),
                                );
                            }

                            if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setDayModalFocusIndex((idx) =>
                                    Math.max(idx - 1, 0),
                                );
                            }

                            if (e.key === "Home") {
                                e.preventDefault();
                                setDayModalFocusIndex(0);
                            }

                            if (e.key === "End") {
                                e.preventDefault();
                                setDayModalFocusIndex(
                                    selectedDayVisits.length - 1,
                                );
                            }

                            if (e.key === "Enter" || e.key === " ") {
                                if (!isVisitRowTarget) {
                                    return;
                                }

                                const target =
                                    dayModalVisitRefs.current[
                                        dayModalFocusIndex
                                    ];

                                if (!target) {
                                    return;
                                }

                                e.preventDefault();
                                target.click();
                            }
                        }}
                        tabIndex={-1}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl">
                                    {format(selectedDay, "EEEE, MMMM dd, yyyy")}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {selectedDayVisits.length} visits
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedDay(null)}
                                className="text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selectedDayVisits.map((visit, index) => {
                                const isFull =
                                    visit.currentAttendees >= visit.capacity;
                                const productLineTheme = getProductLineTheme(
                                    visit.productLine,
                                );

                                return (
                                    <button
                                        key={visit.id}
                                        ref={(node) => {
                                            dayModalVisitRefs.current[index] =
                                                node;
                                        }}
                                        onClick={() => {
                                            setSelectedDay(null);
                                            setSelectedVisit(visit);
                                        }}
                                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {visit.isKeyAccount && (
                                                        <Star className="inline-block w-4 h-4 text-amber-500 fill-amber-400 mr-1" />
                                                    )}
                                                    {visit.customer}
                                                </div>
                                                {hasPostVisitRecord(visit) && (
                                                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Done
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {visit.location}
                                                </div>
                                            </div>

                                            <div className="text-xs text-right">
                                                <div
                                                    className={
                                                        isFull
                                                            ? "text-red-600 font-medium"
                                                            : "text-gray-700"
                                                    }
                                                >
                                                    {visit.currentAttendees}/
                                                    {visit.capacity}
                                                </div>
                                                <div
                                                    className={`mt-1 ${productLineTheme.subtleText}`}
                                                >
                                                    {visit.productLine}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t">
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
