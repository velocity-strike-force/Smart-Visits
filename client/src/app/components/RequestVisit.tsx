import { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import Typeahead from "./Typeahead";
import RequiredLabel from "./RequiredLabel";
import { useReferenceData } from "../referenceData/ReferenceDataContext";

interface RequestVisitFormValues {
    customer: string;
    productLine: string;
    preferredTiming: string;
    notes: string;
}

export default function RequestVisit() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { customerOptions, productLineOptions } = useReferenceData();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<RequestVisitFormValues>({
        defaultValues: {
            customer: "",
            productLine: "",
            preferredTiming: "",
            notes: "",
        },
    });

    useEffect(() => {
        register("productLine", {
            required: "Product line is required",
        });
    }, [register]);

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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const submitRequest = (values: RequestVisitFormValues) => {
        setIsSubmitting(true);

        setTimeout(() => {
            toast.success("Request sent to the sales team.");
            reset();
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
                    onSubmit={handleSubmit(submitRequest)}
                    className="bg-white border rounded-lg p-6 space-y-5"
                >
                    <div>
                        <RequiredLabel
                            className="block text-sm text-gray-600 mb-2"
                            required
                        >
                            Customer Interested In
                        </RequiredLabel>
                        <input
                            type="text"
                            {...register("customer", {
                                required: "Customer is required",
                            })}
                            list="request-visit-customers"
                            placeholder="Example: Acme Corp"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <datalist id="request-visit-customers">
                            {customerOptions.map((customer) => (
                                <option
                                    key={customer.customerId}
                                    value={customer.customerName}
                                />
                            ))}
                        </datalist>
                        {errors.customer && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.customer.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Typeahead
                            label="Product Line"
                            required
                            placeholder="Search product line…"
                            options={productLineOptions}
                            value={watch("productLine")}
                            onChange={(value) =>
                                setValue("productLine", value, {
                                    shouldValidate: true,
                                })
                            }
                        />
                        {errors.productLine && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.productLine.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <RequiredLabel
                            className="block text-sm text-gray-600 mb-2"
                            required
                        >
                            Preferred Timing
                        </RequiredLabel>
                        <input
                            type="text"
                            {...register("preferredTiming", {
                                required: "Preferred timing is required",
                            })}
                            placeholder="Example: Early May, weekday mornings"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        {errors.preferredTiming && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.preferredTiming.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <RequiredLabel className="block text-sm text-gray-600 mb-2">
                            Additional Notes
                        </RequiredLabel>
                        <textarea
                            {...register("notes", {
                                maxLength: {
                                    value: 500,
                                    message:
                                        "Additional notes must be 500 characters or less",
                                },
                            })}
                            placeholder="Share any specific topics, goals, or context for the visit request."
                            className="w-full px-3 py-2 border rounded-lg min-h-[140px]"
                        />
                        {errors.notes && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.notes.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
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
