import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Users, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useUser } from './UserContext';

export default function VisitDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [attendees, setAttendees] = useState(['Sarah Williams', 'Mike Johnson', 'Emily Davis']);
  const [isSignedUp, setIsSignedUp] = useState(attendees.includes(user.name));

  const visit = {
    id: '1',
    title: 'Quarterly Review',
    customer: 'Acme Corp',
    date: new Date(2026, 3, 10),
    endDate: new Date(2026, 3, 10),
    productLine: 'NetSuite',
    location: 'Jacksonville, FL',
    arr: 250000,
    salesRep: 'John Smith',
    domain: 'Manufacturing',
    capacity: 10,
    customerContact: 'Bob Anderson',
    purpose: 'Quarterly Review',
    details: 'Closed-toed shoes required. Meet at main entrance.',
    isPrivate: false,
    isDraft: false,
    creatorEmail: 'john.smith@rfsmart.com',
  };

  const isCreator = user.email === visit.creatorEmail;

  const handleSignUp = () => {
    setIsSignedUp(true);
    setAttendees([...attendees, user.name]);
    toast.success('Successfully signed up for visit!');
  };

  const handleCancelSignUp = () => {
    setIsSignedUp(false);
    setAttendees(attendees.filter(a => a !== user.name));
    toast.success('Sign-up cancelled');
  };

  const handleRemoveAttendee = (attendee: string) => {
    setAttendees(attendees.filter(a => a !== attendee));
    toast.success(`Removed ${attendee} from visit`);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this visit? All invitees will be notified.')) {
      toast.success('Visit deleted and notifications sent');
      navigate('/');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this event? All invitees will be notified.')) {
      toast.success('Event cancelled and notifications sent');
      navigate('/');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="bg-white border-b px-8 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-2">{visit.customer} - {visit.title}</h1>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                {visit.productLine}
              </span>
              {visit.isDraft && isCreator && (
                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                  Draft
                </span>
              )}
              {isSignedUp && !isCreator && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✓ You're Attending
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isCreator ? (
              <>
                <button
                  onClick={() => navigate(`/post-visit?id=${id}`)}
                  className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit Visit
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50"
                >
                  Cancel Event
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg flex items-center gap-2 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                {isSignedUp ? (
                  <button
                    onClick={handleCancelSignUp}
                    className="px-6 py-3 bg-white border-2 border-red-500 text-red-700 rounded-lg hover:bg-red-50 font-medium"
                  >
                    Leave Visit
                  </button>
                ) : (
                  <>
                    {attendees.length >= visit.capacity ? (
                      <div className="flex items-center gap-3">
                        <span className="text-red-600 font-medium">This visit is full</span>
                        <button
                          disabled
                          className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed"
                        >
                          <Users className="w-5 h-5" />
                          Visit Full
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSignUp}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                      >
                        <Users className="w-5 h-5" />
                        Join Visit
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date</span>
              </div>
              <div>
                {format(visit.date, 'MMMM dd, yyyy')}
                {visit.endDate && visit.date.getTime() !== visit.endDate.getTime() &&
                  ` - ${format(visit.endDate, 'MMMM dd, yyyy')}`
                }
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <div>{visit.location}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Capacity</span>
              </div>
              <div className={attendees.length >= visit.capacity ? 'text-red-600' : ''}>
                {attendees.length} / {visit.capacity} attendees
                {attendees.length >= visit.capacity && (
                  <span className="ml-2 text-xs">(Full)</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">ARR</span>
              </div>
              <div>${visit.arr.toLocaleString()}</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="mb-3">Visit Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Customer</span>
                <div>{visit.customer}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Domain</span>
                <div>{visit.domain}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Sales Rep</span>
                <div>{visit.salesRep}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Customer Contact</span>
                <div>{visit.customerContact}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Purpose</span>
                <div>{visit.purpose}</div>
              </div>
            </div>
          </div>

          {visit.details && (
            <div className="border-t pt-6">
              <h3 className="mb-3">Requirements & Notes</h3>
              <p className="text-gray-700">{visit.details}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3>Attendees ({attendees.length} / {visit.capacity})</h3>
              {!isCreator && attendees.length < visit.capacity && !isSignedUp && (
                <button
                  onClick={handleSignUp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Sign Up
                </button>
              )}
            </div>
            {attendees.length === 0 ? (
              <div className="text-center py-8 bg-blue-50 rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                <p className="text-gray-600 mb-3">No attendees yet. Be the first to join!</p>
                {!isCreator && !isSignedUp && (
                  <button
                    onClick={handleSignUp}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Sign Up Now
                  </button>
                )}
              </div>
            ) : (
              <>
                {attendees.length >= visit.capacity && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <span className="font-medium">⚠️ This visit is at full capacity</span>
                  </div>
                )}
                <div className="space-y-2">
                  {attendees.map((attendee, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                          {attendee.charAt(0)}
                        </div>
                        <span>{attendee}</span>
                        {attendee === user.name && (
                          <span className="text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                      {isCreator && (
                        <button
                          onClick={() => handleRemoveAttendee(attendee)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {isCreator && (
            <div className="border-t pt-6">
              <h3 className="mb-3">Visitor Restrictions</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Restrict by Product Line</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
