import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import Typeahead from "./Typeahead";
import RequiredLabel from "./RequiredLabel";
import { Switch } from "./ui/switch";
import { useReferenceData } from "../referenceData/ReferenceDataContext";

interface AccountSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountSettingsModal({
    isOpen,
    onClose,
}: AccountSettingsModalProps) {
    const { productLineOptions } = useReferenceData();
    const [settings, setSettings] = useState({
        productLines: ["NetSuite", "Oracle Cloud"] as string[],
        city: "Jacksonville",
        state: "FL",
        emailNotifications: true,
        slackNotifications: true,
        distanceAlerts: false,
        proximityDistanceMiles: 25,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [outlookConnected, setOutlookConnected] = useState(false);
    const [outlookEmail, setOutlookEmail] = useState("");
    const [outlookLoading, setOutlookLoading] = useState(false);
    const [outlookError, setOutlookError] = useState<string | null>(null);
    const [profileIdentity, setProfileIdentity] = useState({
        name: user.name,
        email: user.email,
    });

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

    useEffect(() => {
        if (!isOpen || !isApi) {
            return;
        }

        let cancelled = false;
        const userId = user.userId || profileUserId();
        setLoading(true);
        setOutlookLoading(true);
        setOutlookError(null);

        Promise.all([
            loadProfileFromApi(userId),
            getOutlookIntegrationStatus(userId).catch(() => ({
                connected: false,
                userId,
                outlookUserEmail: "",
                connectedAt: "",
            })),
        ])
            .then(([profile, outlookStatus]) => {
                if (cancelled) {
                    return;
                }
                setProfileIdentity({
                    name: profile.name,
                    email: profile.email,
                });
                setSettings({
                    productLines: profile.productLines ?? [],
                    city: profile.city ?? "",
                    state: profile.state ?? "",
                    emailNotifications: Boolean(profile.emailNotifications),
                    slackNotifications: Boolean(profile.slackNotifications),
                    distanceAlerts: Boolean(profile.proximityAlerts),
                    proximityDistanceMiles: profile.proximityDistanceMiles ?? 25,
                });
                setOutlookConnected(Boolean(outlookStatus.connected));
                setOutlookEmail(outlookStatus.outlookUserEmail || "");
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                const message =
                    error instanceof Error
                        ? error.message
                        : "Failed to load profile settings";
                toast.error(message);
                setOutlookError(message);
            })
            .finally(() => {
                if (cancelled) {
                    return;
                }
                setLoading(false);
                setOutlookLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, isApi, user.userId]);

    const handleSave = async () => {
        if (!isApi) {
            onClose();
            return;
        }

        const userId = user.userId || profileUserId();
        setSaving(true);
        try {
            await updateProfileFromApi({
                userId,
                productLines: settings.productLines,
                city: settings.city,
                state: settings.state,
                emailNotifications: settings.emailNotifications,
                slackNotifications: settings.slackNotifications,
                proximityAlerts: settings.distanceAlerts,
                proximityDistanceMiles: settings.proximityDistanceMiles,
            });
            toast.success("Preferences updated");
            onClose();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to save preferences"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleConnectOutlook = async () => {
        const userId = user.userId || profileUserId();
        setOutlookLoading(true);
        setOutlookError(null);
        try {
            const { authUrl } = await startOutlookIntegration(userId);
            window.location.assign(authUrl);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to start Outlook OAuth";
            setOutlookError(message);
            toast.error(message);
            setOutlookLoading(false);
        }
    };

    const handleDisconnectOutlook = async () => {
        const userId = user.userId || profileUserId();
        setOutlookLoading(true);
        setOutlookError(null);
        try {
            await disconnectOutlookIntegration(userId);
            setOutlookConnected(false);
            setOutlookEmail("");
            toast.success("Outlook calendar disconnected");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to disconnect Outlook";
            setOutlookError(message);
            toast.error(message);
        } finally {
            setOutlookLoading(false);
        }
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
                                <RequiredLabel className="block mb-2 text-sm">
                                    Name
                                </RequiredLabel>
                                <input
                                    type="text"
                                    value={profileIdentity.name}
                                    disabled
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                                />
                            </div>
                            <div>
                                <RequiredLabel className="block mb-2 text-sm">
                                    Email
                                </RequiredLabel>
                                <input
                                    type="email"
                                    value={profileIdentity.email}
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
                                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
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
                                <RequiredLabel className="block mb-2 text-sm">
                                    City
                                </RequiredLabel>
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
                        <h3 className="mb-4">Notifications</h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between gap-3 text-sm">
                                <span>Email notifications</span>
                                <Switch
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(value) =>
                                        setSettings({
                                            ...settings,
                                            emailNotifications: value,
                                        })
                                    }
                                />
                            </label>
                            <label className="flex items-center justify-between gap-3 text-sm">
                                <span>Slack notifications</span>
                                <Switch
                                    checked={settings.slackNotifications}
                                    onCheckedChange={(value) =>
                                        setSettings({
                                            ...settings,
                                            slackNotifications: value,
                                        })
                                    }
                                />
                            </label>
                            <label className="flex items-center justify-between gap-3 text-sm">
                                <span>Proximity alerts</span>
                                <Switch
                                    checked={settings.distanceAlerts}
                                    onCheckedChange={(value) =>
                                        setSettings({
                                            ...settings,
                                            distanceAlerts: value,
                                        })
                                    }
                                />
                            </label>
                            {settings.distanceAlerts && (
                                <div>
                                    <label className="block mb-2 text-sm">
                                        Distance miles
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={settings.proximityDistanceMiles}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                proximityDistanceMiles: Math.max(
                                                    1,
                                                    Number(e.target.value) || 1
                                                ),
                                            })
                                        }
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4">Outlook Calendar</h3>
                        <div className="rounded-lg border p-4 space-y-3">
                            <p className="text-sm text-gray-700">
                                {outlookConnected
                                    ? `Connected as ${outlookEmail || "your Outlook account"}.`
                                    : "Not connected. Connect to auto-create calendar events for visits."}
                            </p>
                            {outlookError && (
                                <p className="text-sm text-red-600">{outlookError}</p>
                            )}
                            <div className="flex gap-3">
                                {!outlookConnected ? (
                                    <button
                                        type="button"
                                        onClick={handleConnectOutlook}
                                        disabled={outlookLoading || loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {outlookLoading
                                            ? "Connecting..."
                                            : "Connect Outlook"}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleDisconnectOutlook}
                                        disabled={outlookLoading || loading}
                                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {outlookLoading
                                            ? "Disconnecting..."
                                            : "Disconnect Outlook"}
                                    </button>
                                )}
                            </div>
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
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
