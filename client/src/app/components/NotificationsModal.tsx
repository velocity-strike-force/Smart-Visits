import { useState } from 'react';
import { X, Slack, Mail, MapPin } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [outlookEnabled, setOutlookEnabled] = useState(false);
  const [proximityEnabled, setProximityEnabled] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl overflow-hidden flex flex-col shadow-xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl">Notification Settings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose where you want to receive visit updates.
            </p>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Slack className="w-5 h-5" />
              </div>

              <div>
                <h3>Slack Notifications</h3>
                <p className="text-sm text-gray-500">
                  Receive visit updates in Slack.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Integration coming soon.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSlackEnabled(!slackEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                slackEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-pressed={slackEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  slackEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>

              <div>
                <h3>Outlook Notifications</h3>
                <p className="text-sm text-gray-500">
                  Receive visit updates through Outlook.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Integration coming soon.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOutlookEnabled(!outlookEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                outlookEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-pressed={outlookEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  outlookEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>

              <div>
                <h3>Proximity Notifications</h3>
                <p className="text-sm text-gray-500">
                  Receive updates for events created within preferred proximity.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Preferred proximity settings can be added later.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProximityEnabled(!proximityEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                proximityEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-pressed={proximityEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  proximityEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}