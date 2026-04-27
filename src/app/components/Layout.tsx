import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import AccountSettingsModal from './AccountSettingsModal';
import NotificationsModal from './NotificationsModal';
import { useUser } from './UserContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <div className={`h-screen flex flex-col ${(showSettings || showNotifications) ? 'blur-sm' : ''}`}>
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              className="text-xl cursor-pointer hover:text-blue-600"
              onClick={() => navigate('/')}
            >
              Smart Visits
            </h1>
            <nav className="flex gap-1">
              <button
                onClick={() => navigate('/')}
                className={`px-4 py-2 rounded-lg ${
                  location.pathname === '/'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              {user.role === 'sales_rep' && (
                <button
                  onClick={() => navigate('/analytics')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    location.pathname === '/analytics'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
              )}
            </nav>
          </div>
          <ProfileMenu
            onOpenSettings={() => setShowSettings(true)}
            onOpenNotifications={() => setShowNotifications(true)}
          />
        </header>

        <Outlet />
      </div>

      <AccountSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
