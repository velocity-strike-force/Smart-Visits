import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import { useVisits } from "./VisitsContext";

export default function Feedback() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useUser();
    const { getVisit } = useVisits();
    const isSalesRep = user.role === "sales_rep";

    const [feedbackData, setFeedbackData] = useState({
        notes: "",
        keyAreas: [] as string[],
        detractors: "",
        delighters: "",
    });

    const [keyAreaInput, setKeyAreaInput] = useState("");

    const visit = id ? getVisit(id) : undefined;

    const addKeyArea = () => {
        if (
            keyAreaInput.trim() &&
            !feedbackData.keyAreas.includes(keyAreaInput.trim())
        ) {
            setFeedbackData({
                ...feedbackData,
                keyAreas: [...feedbackData.keyAreas, keyAreaInput.trim()],
            });
            setKeyAreaInput("");
        }
    };

    const removeKeyArea = (area: string) => {
        setFeedbackData({
            ...feedbackData,
            keyAreas: feedbackData.keyAreas.filter((a) => a !== area),
        });
    };

    const handleSubmit = () => {
        if (!feedbackData.notes) {
            toast.error("Please provide feedback notes");
            return;
        }

        toast.success("Feedback submitted successfully!");
        navigate("/");
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
                <h1 className="text-2xl">Post-Visit Feedback</h1>
            </div>

            <div className="max-w-4xl mx-auto p-8">
                {visit && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                        <h2 className="mb-4">Visit Summary</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Title:</span>{" "}
                                {visit.title}
                            </div>
                            <div>
                                <span className="text-gray-600">Customer:</span>{" "}
                                {visit.customer}
                            </div>
                            <div>
                                <span className="text-gray-600">Date:</span>{" "}
                                {format(visit.date, "MMMM dd, yyyy")}
                            </div>
                            <div>
                                <span className="text-gray-600">Location:</span>{" "}
                                {visit.location}
                            </div>
                            <div>
                                <span className="text-gray-600">
                                    Product Line:
                                </span>{" "}
                                {visit.productLine}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg border p-6 space-y-6">
                    <div>
                        <label className="block mb-2 text-sm">
                            Feedback Notes{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-2">
                            {isSalesRep
                                ? "Share key takeaways from the visit"
                                : "Required to receive visit credit"}
                        </p>
                        <textarea
                            value={feedbackData.notes}
                            onChange={(e) =>
                                setFeedbackData({
                                    ...feedbackData,
                                    notes: e.target.value,
                                })
                            }
                            rows={6}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Enter your feedback notes..."
                        />
                    </div>

                    <>
                        <div>
                            <label className="block mb-2 text-sm">
                                Key Areas of Focus
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Enter key area"
                                    value={keyAreaInput}
                                    onChange={(e) =>
                                        setKeyAreaInput(e.target.value)
                                    }
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && addKeyArea()
                                    }
                                    className="flex-1 px-3 py-2 border rounded-lg"
                                />
                                <button
                                    onClick={addKeyArea}
                                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {feedbackData.keyAreas.map((area) => (
                                    <span
                                        key={area}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {area}
                                        <button
                                            onClick={() => removeKeyArea(area)}
                                            className="hover:text-blue-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">
                                Detractors
                            </label>
                            <p className="text-sm text-gray-600 mb-2">
                                What challenges or concerns did the customer
                                express?
                            </p>
                            <textarea
                                value={feedbackData.detractors}
                                onChange={(e) =>
                                    setFeedbackData({
                                        ...feedbackData,
                                        detractors: e.target.value,
                                    })
                                }
                                rows={4}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Enter detractors..."
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">
                                Delighters
                            </label>
                            <p className="text-sm text-gray-600 mb-2">
                                What aspects of the visit or product exceeded
                                expectations?
                            </p>
                            <textarea
                                value={feedbackData.delighters}
                                onChange={(e) =>
                                    setFeedbackData({
                                        ...feedbackData,
                                        delighters: e.target.value,
                                    })
                                }
                                rows={4}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Enter delighters..."
                            />
                        </div>
                    </>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
