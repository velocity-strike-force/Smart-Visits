import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import Typeahead from "./Typeahead";
import RequiredLabel from "./RequiredLabel";
import { Switch } from "./ui/switch";
import { getVisitApiBaseUrl } from "../visits/visitSourceConfig";

function apiUrl(path: string): string {
    const base = getVisitApiBaseUrl();
    return base ? `${base}${path}` : path;
}

export default function PostVisit() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialDate = searchParams.get("date")
        ? new Date(searchParams.get("date")!)
        : new Date();

    const [formData, setFormData] = useState({
        productLine: "",
        location: "",
        salesRep: "Kevin Reiter",
        domain: "",
        customer: "",
        startDate: initialDate.toISOString().split("T")[0],
        endDate: initialDate.toISOString().split("T")[0],
        capacity: "",
        invitees: [] as string[],
        customerContact: "",
        purpose: "",
        details: "",
        isPrivate: false,
        notifyEmail: true,
        notifySlack: true,
    });

    const [inviteeInput, setInviteeInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerMetadata, setCustomerMetadata] = useState<{
        arr?: number;
        status?: string;
        isKeyAccount?: boolean;
    } | null>(null);

    const customerSearch = watch("customer");
    const invitees = watch("invitees");

    useEffect(() => {
        register("productLine", {
            required: "Product line is required",
        });
        register("domain", {
            required: "Domain is required",
        });
        register("purpose", {
            required: "Purpose is required",
        });
        register("customer", {
            required: "Customer is required",
        });
    }, [register]);

    const productLineOptions = [
        "Oracle Cloud",
        "NetSuite",
        "Shipping",
        "TMS",
        "Demand Planning",
        "AX",
    ];
    const domainOptions = [
        "Manufacturing",
        "Technology",
        "Logistics",
        "Retail",
        "Healthcare",
    ];
    const purposeOptions = [
        "Quarterly Review",
        "Product Demo",
        "Training",
        "Implementation Review",
        "Contract Renewal",
        "Other",
    ];

    const handleCustomerSelect = (customerName: string) => {
        const customer = mockCustomers.find((c) => c.name === customerName);
        setValue("customer", customerName, { shouldValidate: true });
        if (customer) {
            setCustomerMetadata(customer);
        }
    };

    const addInvitee = () => {
        if (inviteeInput.trim() && !invitees.includes(inviteeInput.trim())) {
            setValue("invitees", [...invitees, inviteeInput.trim()], {
                shouldDirty: true,
            });
            setInviteeInput("");
        }
    };

    const removeInvitee = (invitee: string) => {
        setValue(
            "invitees",
            invitees.filter((i) => i !== invitee),
            { shouldDirty: true },
        );
    };

    const handleSubmit = async (isDraft: boolean) => {
        if (isDraft) {
            toast.success("Visit saved as draft");
            navigate("/");
            return;
        }

        const notificationChannels = [
            formData.notifyEmail ? "email" : null,
            formData.notifySlack ? "Slack" : null,
        ].filter(Boolean);

        const notificationMessage =
            notificationChannels.length > 0
                ? ` Notifications sent via ${notificationChannels.join(" and ")}.`
                : "";

        toast.success(`Visit posted successfully!${notificationMessage}`);

        if (formData.notifySlack) {
            try {
                const res = await fetch(
                    apiUrl("/api/notify/slack/post-visit"),
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            customer: formData.customer,
                            productLine: formData.productLine,
                            location: formData.location,
                            startDate: formData.startDate,
                            endDate: formData.endDate,
                            salesRep: formData.salesRep,
                            domain: formData.domain,
                            purpose: formData.purpose,
                            details: formData.details,
                            capacity: formData.capacity,
                            inviteeCount: formData.invitees.length,
                            isPrivate: formData.isPrivate,
                        }),
                    },
                );
                if (!res.ok) {
                    const data = (await res.json().catch(() => ({}))) as {
                        message?: string;
                    };
                    console.warn(
                        "Slack post-visit notification failed:",
                        data.message ?? res.status,
                    );
                }
            } catch (e) {
                console.warn("Slack post-visit notification failed:", e);
            }
        }

        navigate("/");
    };

    const filteredCustomers = customerSearch
        ? mockCustomers.filter((c) =>
              c.name.toLowerCase().includes(customerSearch.toLowerCase()),
          )
        : [];

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
                <h1 className="text-2xl">Post a Visit</h1>
            </div>

            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg border p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Typeahead
                            label="Product Line"
                            required
                            placeholder="Search product line…"
                            options={productLineOptions}
                            value={watch("productLine")}
                            onChange={(v) =>
                                setValue("productLine", v, {
                                    shouldValidate: true,
                                })
                            }
                        />
                        {errors.productLine && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.productLine.message}
                            </p>
                        )}

                        <div>
                            <RequiredLabel
                                className="block mb-2 text-sm"
                                required
                            >
                                Location
                            </RequiredLabel>
                            <input
                                type="text"
                                placeholder="e.g., Jacksonville, FL"
                                {...register("location", {
                                    required: "Location is required",
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            {errors.location && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.location.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <RequiredLabel
                                className="block mb-2 text-sm"
                                required
                            >
                                Sales Rep Name
                            </RequiredLabel>
                            <input
                                type="text"
                                {...register("salesRep", {
                                    required: "Sales rep name is required",
                                })}
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                            />
                            {errors.salesRep && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.salesRep.message}
                                </p>
                            )}
                        </div>

                        <Typeahead
                            label="Domain"
                            required
                            placeholder="Search domain…"
                            options={domainOptions}
                            value={watch("domain")}
                            onChange={(v) =>
                                setValue("domain", v, {
                                    shouldValidate: true,
                                })
                            }
                        />
                        {errors.domain && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.domain.message}
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <RequiredLabel className="block mb-2 text-sm" required>
                            Customer
                        </RequiredLabel>
                        <input
                            type="text"
                            placeholder="Search for customer"
                            value={customerSearch}
                            onChange={(e) => {
                                setValue("customer", e.target.value, {
                                    shouldValidate: true,
                                });
                                setCustomerMetadata(null);
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        {errors.customer && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.customer.message}
                            </p>
                        )}
                        {customerSearch &&
                            filteredCustomers.length > 0 &&
                            !customerMetadata && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                                    {filteredCustomers.map((customer) => (
                                        <button
                                            key={customer.name}
                                            onClick={() =>
                                                handleCustomerSelect(
                                                    customer.name,
                                                )
                                            }
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50"
                                        >
                                            {customer.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        {customerMetadata && (
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                    ARR: $
                                    {customerMetadata.arr?.toLocaleString()}
                                </span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                    {customerMetadata.status}
                                </span>
                                {customerMetadata.isKeyAccount && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                        Key Account
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <RequiredLabel
                                className="block mb-2 text-sm"
                                required
                            >
                                Start Date
                            </RequiredLabel>
                            <input
                                type="date"
                                {...register("startDate", {
                                    required: "Start date is required",
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            {errors.startDate && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.startDate.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <RequiredLabel
                                className="block mb-2 text-sm"
                                required
                            >
                                End Date
                            </RequiredLabel>
                            <input
                                type="date"
                                {...register("endDate", {
                                    required: "End date is required",
                                    validate: (value) => {
                                        const startDate =
                                            getValues("startDate");
                                        return (
                                            !startDate ||
                                            value >= startDate ||
                                            "End date must be on or after start date"
                                        );
                                    },
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            {errors.endDate && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.endDate.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <RequiredLabel className="block mb-2 text-sm" required>
                            Capacity (Max Attendees)
                        </RequiredLabel>
                        <input
                            type="number"
                            placeholder="e.g., 10"
                            {...register("capacity", {
                                required: "Capacity is required",
                                validate: (value) =>
                                    Number(value) > 0 ||
                                    "Capacity must be greater than 0",
                            })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        {errors.capacity && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.capacity.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <RequiredLabel className="block mb-2 text-sm">
                            Invitees
                        </RequiredLabel>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Enter name or email"
                                value={inviteeInput}
                                onChange={(e) =>
                                    setInviteeInput(e.target.value)
                                }
                                onKeyPress={(e) =>
                                    e.key === "Enter" && addInvitee()
                                }
                                className="flex-1 px-3 py-2 border rounded-lg"
                            />
                            <button
                                onClick={addInvitee}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {invitees.map((invitee) => (
                                <span
                                    key={invitee}
                                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2"
                                >
                                    {invitee}
                                    <button
                                        onClick={() => removeInvitee(invitee)}
                                        className="hover:text-red-900"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <RequiredLabel className="block mb-2 text-sm" required>
                            Customer Contact Rep
                        </RequiredLabel>
                        <input
                            type="text"
                            placeholder="Contact person at customer site"
                            {...register("customerContact", {
                                required: "Customer contact is required",
                            })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        {errors.customerContact && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.customerContact.message}
                            </p>
                        )}
                    </div>

                    <Typeahead
                        label="Purpose for Visit"
                        required
                        placeholder="Search purpose…"
                        options={purposeOptions}
                        value={watch("purpose")}
                        onChange={(v) =>
                            setValue("purpose", v, {
                                shouldValidate: true,
                            })
                        }
                    />
                    {errors.purpose && (
                        <p className="text-sm text-red-600 -mt-4">
                            {errors.purpose.message}
                        </p>
                    )}

                    <div>
                        <RequiredLabel className="block mb-2 text-sm" required>
                            Visit Details / Requirements
                        </RequiredLabel>
                        <textarea
                            placeholder="e.g., Closed-toed shoes required, parking information, etc."
                            {...register("details", {
                                required: "Visit details are required",
                                minLength: {
                                    value: 10,
                                    message:
                                        "Visit details should be at least 10 characters",
                                },
                            })}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        {errors.details && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.details.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <RequiredLabel className="flex items-center justify-between gap-3">
                            <span className="text-sm">Private Event</span>
                            <Switch
                                checked={watch("isPrivate")}
                                onCheckedChange={(checked) =>
                                    setValue("isPrivate", checked)
                                }
                            />
                        </RequiredLabel>
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-medium">Notifications</h3>

                        <RequiredLabel className="flex items-center justify-between rounded-lg border p-3 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                                    <Mail className="w-4 h-4" />
                                </div>

                                <div>
                                    <p className="text-sm">Notify by Email</p>
                                </div>
                            </div>

                            <Switch
                                checked={watch("notifyEmail")}
                                onCheckedChange={(checked) =>
                                    setValue("notifyEmail", checked)
                                }
                            />
                        </RequiredLabel>

                        <RequiredLabel className="flex items-center justify-between rounded-lg border p-3 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                                    <MessagesSquare className="w-4 h-4" />
                                </div>

                                <div>
                                    <p className="text-sm">Notify in Slack</p>
                                </div>
                            </div>

                            <Switch
                                checked={watch("notifySlack")}
                                onCheckedChange={(checked) =>
                                    setValue("notifySlack", checked)
                                }
                            />
                        </RequiredLabel>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => navigate("/")}
                            disabled={isSubmitting}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitDraft}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving…" : "Save as Draft"}
                        </button>
                        <button
                            onClick={handleSubmit(submitPost)}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Posting…" : "Post Visit"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
