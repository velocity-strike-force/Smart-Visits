import { useEffect, useMemo, useRef, useState } from "react";
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
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
} from "date-fns";
import FilterPanel from "./FilterPanel";
import { useUser } from "./UserContext";
import { useVisits, type Visit as VisitsContextVisit } from "./VisitsContext";
import { createDefaultVisitFilters, type VisitFilters } from "./visitFilters";
import { getProductLineTheme } from "./productLineTheme";

type Visit = VisitsContextVisit & { currentAttendees: number };

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { visits: contextVisits } = useVisits();
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
    const visits = useMemo<Visit[]>(
        () =>
            contextVisits.map((visit) => ({
                ...visit,
                currentAttendees: visit.attendees.length,
            })),
        [contextVisits],
    );

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

    const getVisitEndDate = (visit: Visit) => visit.endDate ?? visit.date;

    const doesVisitOccurOnDay = (visit: Visit, day: Date) => {
        const dayTime = startOfDay(day).getTime();
        const visitStart = startOfDay(visit.date).getTime();
        const visitEnd = endOfDay(getVisitEndDate(visit)).getTime();

        return dayTime >= visitStart && dayTime <= visitEnd;
    };

    const doesVisitOverlapMonth = (visit: Visit) => {
        const visitStart = startOfDay(visit.date).getTime();
        const visitEnd = endOfDay(getVisitEndDate(visit)).getTime();
        const visibleMonthStart = startOfDay(monthStart).getTime();
        const visibleMonthEnd = endOfDay(monthEnd).getTime();

        return visitStart <= visibleMonthEnd && visitEnd >= visibleMonthStart;
    };

    const formatVisitDateRange = (
        visit: Visit,
        formatPattern = "MMM dd, yyyy",
    ) => {
        const visitEndDate = getVisitEndDate(visit);

        if (isSameDay(visit.date, visitEndDate)) {
            return format(visit.date, formatPattern);
        }

        return `${format(visit.date, formatPattern)} - ${format(visitEndDate, formatPattern)}`;
    };
    const getVisitsForDay = (day: Date) => {
        return filteredVisits.filter((visit) =>
            doesVisitOccurOnDay(visit, day),
        );
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
            <div className="bg-white border-b px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
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
                                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${
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
                            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg flex items-center gap-1.5 hover:bg-gray-50"
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
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={previousMonth}
                            aria-label="Previous month"
                            className="p-1.5 border rounded hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <h2 className="text-lg min-w-[140px] text-center">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>

                        <button
                            onClick={nextMonth}
                            aria-label="Next month"
                            className="p-1.5 border rounded hover:bg-gray-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto">
                {showFilters && (
                    <div className="bg-white border-b p-4">
                        <FilterPanel
                            visits={baseVisits}
                            filters={appliedFilters}
                            onChange={setAppliedFilters}
                        />
                    </div>
                )}

                <div className="p-4">
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
                                        className="px-2 py-2 text-center text-sm border-r last:border-r-0"
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
                                            key={`${day.toISOString()}-${idx}`}
                                            className="min-h-[92px] border-r border-b last:border-r-0 p-1.5 hover:bg-gray-50 cursor-pointer"
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
                            <div className="flex items-center justify-center gap-3 px-6 py-4 border-b bg-gray-50">
                                <button
                                    onClick={previousMonth}
                                    aria-label="Previous month"
                                    className="p-1.5 border rounded hover:bg-white"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <h2 className="text-lg min-w-[140px] text-center">
                                    {format(currentDate, "MMMM yyyy")}
                                </h2>

                                <button
                                    onClick={nextMonth}
                                    aria-label="Next month"
                                    className="p-1.5 border rounded hover:bg-white"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
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
                                            doesVisitOverlapMonth(visit),
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
                                                        {formatVisitDateRange(
                                                            visit,
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
                                                                    : "View Details"}
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
                                    {formatVisitDateRange(
                                        selectedVisit,
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
