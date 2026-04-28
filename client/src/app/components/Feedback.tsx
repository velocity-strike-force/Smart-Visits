import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import { useVisits } from "./VisitsContext";
import Typeahead from "./Typeahead";

export default function Feedback() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useUser();
    const { visits, getVisit } = useVisits();
    const isSalesRep = user.role === "sales_rep";

    const [feedbackData, setFeedbackData] = useState({
        notes: "",
        keyAreas: [] as string[],
        detractors: "",
        delighters: "",
    });

    const [keyAreaInput, setKeyAreaInput] = useState("");
    const [visitSearch, setVisitSearch] = useState("");

    const visit = id ? getVisit(id) : undefined;
    const today = startOfDay(new Date());
    const selectedPastVisit = visit && visit.date < today ? visit : undefined;

    const selectableVisits = visits
        .filter((v) => v.date < today)
        .filter((v) => {
            if (isSalesRep) {
                return v.creatorEmail === user.email || v.salesRep === user.name;
            }
            return v.attendees.includes(user.name);
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const selectableVisitOptions = selectableVisits.map((v) => ({
        id: v.id,
        label: `${v.title} - ${v.customer} (${format(v.date, "MMM dd, yyyy")})`,
    }));

    const normalizedVisitSearch = visitSearch.trim().toLowerCase();
    const filteredSelectableVisits = normalizedVisitSearch
        ? selectableVisits.filter((v) =>
              `${v.title} ${v.customer} ${v.productLine} ${v.location}`
                  .toLowerCase()
                  .includes(normalizedVisitSearch),
          )
        : selectableVisits;

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
        if (!selectedPastVisit) {
            toast.error("Please select a past visit first");
            return;
        }

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
                {!id && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                        <h2 className="text-lg mb-2">Select a Past Visit</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Choose a completed visit to create a post-visit
                            record.
                        </p>

                        <Typeahead
                            label="Find Visit"
                            placeholder="Search by title, customer, product line, or location"
                            options={selectableVisitOptions.map((o) => o.label)}
                            value={visitSearch}
                            onChange={(value) => {
                                setVisitSearch(value);
                                const selectedOption =
                                    selectableVisitOptions.find(
                                        (o) => o.label === value,
                                    );
                                if (selectedOption) {
                                    navigate(`/feedback/${selectedOption.id}`);
                                }
                            }}
                            className="mb-4"
                        />

                        {selectableVisits.length === 0 ? (
                            <div className="text-sm text-gray-500 border rounded-lg p-4">
                                No past visits are available for your account.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredSelectableVisits.map((pastVisit) => (
                                    <button
                                        key={pastVisit.id}
                                        onClick={() =>
                                            navigate(`/feedback/${pastVisit.id}`)
                                        }
                                        className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {pastVisit.title}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {pastVisit.customer} • {" "}
                                                    {pastVisit.productLine} • {" "}
                                                    {pastVisit.location}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 whitespace-nowrap">
                                                {format(
                                                    pastVisit.date,
                                                    "MMM dd, yyyy",
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {filteredSelectableVisits.length === 0 && (
                                    <div className="text-sm text-gray-500 border rounded-lg p-4">
                                        No visits match your search.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {id && !selectedPastVisit && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 mb-6 text-sm">
                        This visit is not in the past. Please select a completed
                        visit to create post-visit feedback.
                    </div>
                )}

                {selectedPastVisit && (
                    <div className="bg-white rounded-lg border p-6 mb-6">
                        <h2 className="mb-4">Visit Summary</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Title:</span>{" "}
                                {selectedPastVisit.title}
                            </div>
                            <div>
                                <span className="text-gray-600">Customer:</span>{" "}
                                {selectedPastVisit.customer}
                            </div>
                            <div>
                                <span className="text-gray-600">Date:</span>{" "}
                                {format(selectedPastVisit.date, "MMMM dd, yyyy")}
                            </div>
                            <div>
                                <span className="text-gray-600">Location:</span>{" "}
                                {selectedPastVisit.location}
                            </div>
                            <div>
                                <span className="text-gray-600">
                                    Product Line:
                                </span>{" "}
                                {selectedPastVisit.productLine}
                            </div>
                        </div>
                    </div>
                )}

                {selectedPastVisit && (
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
                                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {area}
                                        <button
                                            onClick={() => removeKeyArea(area)}
                                            className="hover:text-red-900"
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
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Submit Feedback
                        </button>
                    </div>
                    </div>
                )}
            </div>
        </div>
    );
}
