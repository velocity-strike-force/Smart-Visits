export const getProductLineTheme = (productLine: string) => {
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
