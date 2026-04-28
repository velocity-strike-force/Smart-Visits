import { useState } from "react";
import { X } from "lucide-react";
import Typeahead from "./Typeahead";
import { Switch } from "./ui/switch";

interface AccountSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountSettingsModal({
    isOpen,
    onClose,
}: AccountSettingsModalProps) {
    const [settings, setSettings] = useState({
        productLines: ["NetSuite", "Oracle Cloud"] as string[],
        city: "Jacksonville",
        state: "FL",
        emailNotifications: true,
        slackNotifications: true,
        distanceAlerts: false,
    });

    const productLineOptions = [
        "Oracle Cloud",
        "NetSuite",
        "Shipping",
        "TMS",
        "Demand Planning",
        "AX",
    ];
    const stateOptions = [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
    ];

    const handleProductLineToggle = (line: string) => {
        setSettings((prev) => ({
            ...prev,
            productLines: prev.productLines.includes(line)
                ? prev.productLines.filter((l) => l !== line)
                : [...prev.productLines, line],
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl">Preferences</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                    <div>
                        <h3 className="mb-4">Profile</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 text-sm">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value="Sonny Antunes"
                                    disabled
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value="sonny.antunes@rfsmart.com"
                                    disabled
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4">Product Lines</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {productLineOptions.map((line) => (
                                <label
                                    key={line}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <span>{line}</span>
                                    <Switch
                                        checked={settings.productLines.includes(
                                            line,
                                        )}
                                        onCheckedChange={() =>
                                            handleProductLineToggle(line)
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4">Location</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={settings.city}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            city: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <Typeahead
                                    label="State"
                                    placeholder="Search state…"
                                    options={stateOptions}
                                    value={settings.state}
                                    onChange={(v) =>
                                        setSettings({ ...settings, state: v })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4">Notification Preferences</h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-sm">
                                    Email notifications
                                </span>
                                <Switch
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            emailNotifications: checked,
                                        })
                                    }
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm">
                                    Slack DM notifications
                                </span>
                                <Switch
                                    checked={settings.slackNotifications}
                                    onCheckedChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            slackNotifications: checked,
                                        })
                                    }
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm">
                                    Distance from location alerts
                                </span>
                                <Switch
                                    checked={settings.distanceAlerts}
                                    onCheckedChange={(checked) =>
                                        setSettings({
                                            ...settings,
                                            distanceAlerts: checked,
                                        })
                                    }
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
