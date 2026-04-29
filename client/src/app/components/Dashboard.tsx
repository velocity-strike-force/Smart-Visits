import { useState } from 'react';
import { Calendar, List, Filter, Plus, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import FilterPanel from './FilterPanel';
import { useUser } from './UserContext';
import { useVisits } from './VisitsContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { visits, visitsLoading, visitsError } = useVisits();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  // Filter out draft visits for visitors
  const filteredVisits = user.role === 'visitor'
    ? visits.filter(v => !v.isDraft)
    : visits;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getVisitsForDay = (day: Date) => {
    return filteredVisits.filter(visit => isSameDay(visit.date, day));
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-white border-b px-8 py-6">
        {visitsError && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-800 px-4 py-2 text-sm border border-red-100">
            {visitsError}
          </div>
        )}
        {visitsLoading && (
          <div className="mb-4 text-gray-600 text-sm">Loading visits…</div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === 'calendar' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {user.role === 'sales_rep' && (
              <button
                onClick={() => navigate('/post-visit')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Post a Visit
              </button>
            )}
          </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button onClick={previousMonth} className="px-3 py-1 border rounded hover:bg-gray-50">
                Previous
              </button>
              <button onClick={nextMonth} className="px-3 py-1 border rounded hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {showFilters && (
          <div className="bg-white border-b p-6">
            <FilterPanel visits={filteredVisits} />
          </div>
        )}

        <div className="p-8">
          {viewMode === 'calendar' ? (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="px-4 py-3 text-center border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {daysInMonth.map((day, idx) => {
                  const dayVisits = getVisitsForDay(day);
                  return (
                    <div
                      key={idx}
                      className="min-h-[120px] border-r border-b last:border-r-0 p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (user.role === 'sales_rep') {
                          navigate(`/post-visit?date=${day.toISOString()}`);
                        }
                      }}
                    >
                      <div className={`mb-2 ${!isSameMonth(day, currentDate) ? 'text-gray-400' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayVisits.map(visit => {
                          const isFull = visit.attendees.length >= visit.capacity;
                          const isUserSignedUp = visit.attendees.includes(user.name);
                          return (
                            <div
                              key={visit.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/visit/${visit.id}`);
                              }}
                              className={`text-xs p-2 rounded hover:opacity-90 relative cursor-pointer ${
                                isFull ? 'bg-gray-100 text-gray-600' :
                                isUserSignedUp ? 'bg-green-100 text-green-800 border border-green-300' :
                                'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <div className="truncate flex items-center gap-1">
                                {isUserSignedUp && <CheckCircle className="w-3 h-3 text-green-600" />}
                                {visit.customer}
                              </div>
                              <div className={`text-[10px] mt-1 flex items-center justify-between`}>
                                <span className="truncate flex-1">{visit.location}</span>
                                <span className={isFull ? 'text-red-600 font-medium' : ''}>
                                  {visit.attendees.length}/{visit.capacity}
                                </span>
                              </div>
                              {visit.isDraft && user.role === 'sales_rep' && (
                                <span className="absolute top-0 right-0 px-1 text-[10px] bg-gray-400 text-white rounded-bl">
                                  Draft
                                </span>
                              )}
                              {isFull && !isUserSignedUp && (
                                <span className="absolute top-0 right-0 px-1 text-[10px] bg-red-500 text-white rounded-bl">
                                  Full
                                </span>
                              )}
                              {isUserSignedUp && (
                                <span className="absolute top-0 right-0 px-1 text-[10px] bg-green-600 text-white rounded-bl">
                                  Signed Up
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="px-3 py-1 border rounded hover:bg-white flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={nextMonth}
                    className="px-3 py-1 border rounded hover:bg-white flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Location</th>
                    <th className="px-6 py-3 text-left">Product Line</th>
                    <th className="px-6 py-3 text-left">Sales Rep</th>
                    <th className="px-6 py-3 text-left">ARR</th>
                    <th className="px-6 py-3 text-left">Capacity</th>
                    {user.role === 'sales_rep' && <th className="px-6 py-3 text-left">Status</th>}
                    {user.role === 'visitor' && <th className="px-6 py-3 text-left"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits
                    .filter(visit => isSameMonth(visit.date, currentDate))
                    .map(visit => {
                      const isFull = visit.attendees.length >= visit.capacity;
                      const spotsLeft = visit.capacity - visit.attendees.length;
                      const isUserSignedUp = visit.attendees.includes(user.name);
                      return (
                        <tr
                          key={visit.id}
                          className={`border-b hover:bg-gray-50 ${isUserSignedUp ? 'bg-green-50' : ''}`}
                        >
                          <td className="px-6 py-4">{format(visit.date, 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isUserSignedUp && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {visit.customer}
                            </div>
                          </td>
                          <td className="px-6 py-4">{visit.location}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {visit.productLine}
                            </span>
                          </td>
                          <td className="px-6 py-4">{visit.salesRep}</td>
                          <td className="px-6 py-4">${visit.arr.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={isFull ? 'text-red-600 font-medium' : ''}>
                                {visit.attendees.length} / {visit.capacity}
                              </span>
                              {isFull ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Full</span>
                              ) : spotsLeft <= 3 && spotsLeft > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                  {spotsLeft} left
                                </span>
                              )}
                            </div>
                          </td>
                          {user.role === 'sales_rep' && (
                            <td className="px-6 py-4">
                              {visit.isDraft ? (
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">Draft</span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                              )}
                            </td>
                          )}
                          {user.role === 'visitor' && (
                            <td className="px-6 py-4">
                              {isUserSignedUp ? (
                                <button
                                  onClick={() => navigate(`/visit/${visit.id}`)}
                                  className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-medium border border-green-300"
                                >
                                  View Visit
                                </button>
                              ) : isFull ? (
                                <button
                                  disabled
                                  className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm cursor-not-allowed"
                                >
                                  Visit Full
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/visit/${visit.id}`)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                  Sign Up
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
