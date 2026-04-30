import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OutlookCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const status = searchParams.get("status") || "error";
    const message =
        searchParams.get("message") ||
        (status === "success"
            ? "Outlook connected successfully."
            : "Outlook connection failed.");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            navigate("/");
        }, 2500);
        return () => window.clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white border rounded-lg max-w-lg w-full p-6 text-center">
                <h1 className="text-xl mb-3">
                    {status === "success"
                        ? "Outlook Integration Connected"
                        : "Outlook Integration Error"}
                </h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
