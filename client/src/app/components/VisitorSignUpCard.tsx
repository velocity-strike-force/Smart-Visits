import { Users, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface VisitorSignUpCardProps {
  visit: {
    customer: string;
    date: Date;
    location: string;
    capacity: number;
    currentAttendees: number;
  };
  onSignUp: () => void;
  isSignedUp: boolean;
}

export default function VisitorSignUpCard({ visit, onSignUp, isSignedUp }: VisitorSignUpCardProps) {
  const isFull = visit.currentAttendees >= visit.capacity;
  const spotsLeft = visit.capacity - visit.currentAttendees;

  if (isSignedUp) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center">
            <span className="text-xl">✓</span>
          </div>
          <h3 className="text-lg font-medium text-green-800">You're signed up for this visit!</h3>
        </div>
        <p className="text-green-700 text-sm">
          We'll send you a reminder before the visit. See you there!
        </p>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-medium text-red-800">This visit is full</h3>
        </div>
        <p className="text-red-700 text-sm">
          All {visit.capacity} spots have been taken. Check back later for new visits.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-medium mb-2 text-gray-900">Join this customer visit</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(visit.date, 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{visit.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {visit.currentAttendees} / {visit.capacity} attendees
                {spotsLeft <= 3 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    (Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left!)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onSignUp}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
        >
          <Users className="w-6 h-6" />
          Sign Up Now
        </button>
      </div>
    </div>
  );
}
