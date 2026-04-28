import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Typeahead from "./Typeahead";

export default function PostVisit() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialDate = searchParams.get("date")
        ? new Date(searchParams.get("date")!)
        : new Date();

    const [formData, setFormData] = useState({
        productLine: "",
        location: "",
        salesRep: "John Smith",
        domain: "",
        customer: "",
        startDate: initialDate.toISOString().split("T")[0],
        endDate: initialDate.toISOString().split("T")[0],
        capacity: "",
        invitees: [] as string[],
        customerContact: "",
        purpose: "",
        details: "",
        keyAreasOfFocus: "",
        detractors: "",
        delighters: "",
        isPrivate: false,
    });

    const [inviteeInput, setInviteeInput] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerMetadata, setCustomerMetadata] = useState<{
        arr?: number;
        status?: string;
        isKeyAccount?: boolean;
    } | null>(null);

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

    const mockCustomers = [
        {
            name: "Acme Corp",
            arr: 250000,
            status: "Active",
            isKeyAccount: true,
        },
        {
            name: "TechStart Inc",
            arr: 150000,
            status: "Implementation",
            isKeyAccount: false,
        },
        {
            name: "Global Logistics",
            arr: 500000,
            status: "Active",
            isKeyAccount: true,
        },
        {
            name: "RetailMax",
            arr: 180000,
            status: "Active",
            isKeyAccount: false,
        },
    ];

    const handleCustomerSelect = (customerName: string) => {
        const customer = mockCustomers.find((c) => c.name === customerName);
        setFormData({ ...formData, customer: customerName });
        setCustomerSearch(customerName);
        if (customer) {
            setCustomerMetadata(customer);
        }
    };

    const addInvitee = () => {
        if (
            inviteeInput.trim() &&
            !formData.invitees.includes(inviteeInput.trim())
        ) {
            setFormData({
                ...formData,
                invitees: [...formData.invitees, inviteeInput.trim()],
            });
            setInviteeInput("");
        }
    };

    const removeInvitee = (invitee: string) => {
        setFormData({
            ...formData,
            invitees: formData.invitees.filter((i) => i !== invitee),
        });
    };

    const handleSubmit = (isDraft: boolean) => {
        if (isDraft) {
            toast.success("Visit saved as draft");
        } else {
            toast.success("Visit posted successfully!");
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
                            placeholder="Search product line…"
                            options={productLineOptions}
                            value={formData.productLine}
                            onChange={(v) =>
                                setFormData({ ...formData, productLine: v })
                            }
                        />

                        <div>
                            <label className="block mb-2 text-sm">
                                Location
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Jacksonville, FL"
                                value={formData.location}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        location: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">
                                Sales Rep Name
                            </label>
                            <input
                                type="text"
                                value={formData.salesRep}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        salesRep: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                            />
                        </div>

                        <Typeahead
                            label="Domain"
                            placeholder="Search domain…"
                            options={domainOptions}
                            value={formData.domain}
                            onChange={(v) =>
                                setFormData({ ...formData, domain: v })
                            }
                        />
                    </div>

                    <div className="relative">
                        <label className="block mb-2 text-sm">Customer</label>
                        <input
                            type="text"
                            placeholder="Search for customer"
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setCustomerMetadata(null);
                            }}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
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
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
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
                            <label className="block mb-2 text-sm">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        startDate: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        endDate: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm">
                            Capacity (Max Attendees)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g., 10"
                            value={formData.capacity}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    capacity: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm">Invitees</label>
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
                            {formData.invitees.map((invitee) => (
                                <span
                                    key={invitee}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                                >
                                    {invitee}
                                    <button
                                        onClick={() => removeInvitee(invitee)}
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
                            Customer Contact Rep
                        </label>
                        <input
                            type="text"
                            placeholder="Contact person at customer site"
                            value={formData.customerContact}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    customerContact: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <Typeahead
                        label="Purpose for Visit"
                        placeholder="Search purpose…"
                        options={purposeOptions}
                        value={formData.purpose}
                        onChange={(v) =>
                            setFormData({ ...formData, purpose: v })
                        }
                    />

                    <div>
                        <label className="block mb-2 text-sm">
                            Visit Details / Requirements
                        </label>
                        <textarea
                            placeholder="e.g., Closed-toed shoes required, parking information, etc."
                            value={formData.details}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    details: e.target.value,
                                })
                            }
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm">
                            Key areas of focus
                        </label>
                        <textarea
                            placeholder="What key areas were discussed during the visit?"
                            value={formData.keyAreasOfFocus}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    keyAreasOfFocus: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm">Detractors</label>
                        <textarea
                            placeholder="What concerns or blockers came up?"
                            value={formData.detractors}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    detractors: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm">Delighters</label>
                        <textarea
                            placeholder="What went well or exceeded expectations?"
                            value={formData.delighters}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    delighters: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isPrivate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isPrivate: e.target.checked,
                                    })
                                }
                                className="rounded"
                            />
                            <span className="text-sm">Private Event</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSubmit(true)}
                            className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={() => handleSubmit(false)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Post Visit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
