import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "./UserContext";

const productLineOptions = [
    "NetSuite",
    "Oracle Cloud",
    "TMS",
    "Shipping",
    "Other",
];

export default function RequestVisit() {
    const navigate = useNavigate();
    const { user } = useUser();

    const [customer, setCustomer] = useState("");
    const [productLine, setProductLine] = useState("");
    const [preferredTiming, setPreferredTiming] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user.role !== "visitor") {
        return (
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white border rounded-lg p-8 max-w-md">
                    <h2 className="text-2xl mb-3">Visitor Only Page</h2>
                    <p className="text-gray-600 mb-6">
                        Request Visit is available only for visitors.
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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!customer.trim() || !productLine || !preferredTiming.trim()) {
            toast.error(
                "Please fill customer, product line, and preferred timing.",
            );
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            toast.success("Request sent to the sales team.");
            setCustomer("");
            setProductLine("");
            setPreferredTiming("");
            setNotes("");
            setIsSubmitting(false);
        }, 350);
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
                <h1 className="text-2xl">Request Visit</h1>
                <p className="text-gray-600 mt-1">
                    Fill in the details below and submit your request directly
                    to the sales team.
                </p>
            </div>

            <div className="max-w-3xl mx-auto p-8">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border rounded-lg p-6 space-y-5"
                >
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">
                            Customer Interested In
                        </label>
                        <input
                            type="text"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            placeholder="Example: Acme Corp"
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">
                            Product Line
                        </label>
                        <select
                            value={productLine}
                            onChange={(e) => setProductLine(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        >
                            <option value="">Select a product line</option>
                            {productLineOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">
                            Preferred Timing
                        </label>
                        <input
                            type="text"
                            value={preferredTiming}
                            onChange={(e) => setPreferredTiming(e.target.value)}
                            placeholder="Example: Early May, weekday mornings"
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Share any specific topics, goals, or context for the visit request."
                            className="w-full px-3 py-2 border rounded-lg min-h-[140px]"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
