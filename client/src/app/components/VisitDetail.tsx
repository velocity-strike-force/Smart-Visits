import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Users,
    MapPin,
    Calendar,
    DollarSign,
    CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import { useVisits } from "./VisitsContext";
import VisitorSignUpCard from "./VisitorSignUpCard";
import { Switch } from "./ui/switch";

export default function VisitDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const { getVisit, addAttendee, removeAttendee, visitsLoading, visitsError } =
    useVisits();

  const visit = getVisit(id || "");

  if (visitsLoading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading visit…</p>
      </div>
    );
  }

  if (visitsError) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-xl mb-2 text-red-700">Could not load visits</h2>
          <p className="text-gray-600 mb-4">{visitsError}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Visit not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isCreator = user.email === visit.creatorEmail;
  const isVisitor = user.role === "visitor";
  const canManageVisit = user.role === "sales_rep" && isCreator;
  const isSignedUp = visit.attendees.includes(user.name);
  const canVisitorJoin =
    isVisitor && !isSignedUp && visit.attendees.length < visit.capacity;
  const hasPostVisitRecord = (visit.postVisitRecordCount ?? 0) > 0;

  const handleSignUp = () => {
    if (!isVisitor) {
      toast.error("Only visitors can join as attendees");
      return;
    }

    if (visit.attendees.length >= visit.capacity) {
      toast.error("This visit is full");
      return;
    }
    addAttendee(visit.id, user.name);
    toast.success("Successfully signed up for visit!");
  };

  const handleCancelSignUp = () => {
    if (!isVisitor) {
      toast.error("Only visitors can leave attendee sign-up");
      return;
    }

    removeAttendee(visit.id, user.name);
    toast.success("You have left the visit");
  };

  const handleRemoveAttendee = (attendee: string) => {
    if (!canManageVisit) {
      toast.error("Only sales reps can remove attendees");
      return;
    }

    removeAttendee(visit.id, attendee);
    toast.success(`Removed ${attendee} from visit`);
  };

  const handleDelete = () => {
    if (!canManageVisit) {
      toast.error("Only sales reps can delete visits");
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this visit? All invitees will be notified.",
      )
    ) {
      toast.success("Visit deleted and notifications sent");
      navigate("/");
    }
  };

  const handleCancel = () => {
    if (!canManageVisit) {
      toast.error("Only sales reps can cancel visits");
      return;
    }

    if (
      confirm(
        "Are you sure you want to cancel this event? All invitees will be notified.",
      )
    ) {
      toast.success("Event cancelled and notifications sent");
      navigate("/");
    }
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
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl mb-2">
                            {visit.customer} - {visit.title}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                                {visit.productLine}
                            </span>
                            {visit.isDraft && isCreator && (
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                                    Draft
                                </span>
                            )}
                            {isSignedUp && isVisitor && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                                    <span className="text-green-600">✓</span>{" "}
                                    You're Attending
                                </span>
                            )}
                            {hasPostVisitRecord && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done ({visit.postVisitRecordCount}{" "}
                                    post-visit record
                                    {visit.postVisitRecordCount === 1
                                        ? ""
                                        : "s"}
                                    )
                                </span>
                            )}
                        </div>
                    </div>
                    {canManageVisit && (
                        <div className="flex gap-3">
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
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-8">
                {isVisitor && (
                    <>
                        <div className="mb-6">
                            <VisitorSignUpCard
                                visit={{
                                    customer: visit.customer,
                                    date: visit.date,
                                    location: visit.location,
                                    capacity: visit.capacity,
                                    currentAttendees: visit.attendees.length,
                                }}
                                onSignUp={handleSignUp}
                                isSignedUp={isSignedUp}
                            />
                        </div>
                        {isSignedUp && (
                            <div className="mb-6 flex justify-end">
                                <button
                                    onClick={handleCancelSignUp}
                                    className="px-8 py-3 bg-white border-2 border-red-500 text-red-700 rounded-lg hover:bg-red-50 font-medium"
                                >
                                    Leave Visit
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="bg-white rounded-lg border p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">Date</span>
                            </div>
                            <div>
                                {format(visit.date, "MMMM dd, yyyy")}
                                {visit.endDate &&
                                    visit.date.getTime() !==
                                        visit.endDate.getTime() &&
                                    ` - ${format(visit.endDate, "MMMM dd, yyyy")}`}
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
                            <div
                                className={
                                    visit.attendees.length >= visit.capacity
                                        ? "text-red-600"
                                        : ""
                                }
                            >
                                {visit.attendees.length} / {visit.capacity}{" "}
                                attendees
                                {visit.attendees.length >= visit.capacity && (
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
                                <span className="text-sm text-gray-600">
                                    Customer
                                </span>
                                <div>{visit.customer}</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">
                                    Domain
                                </span>
                                <div>{visit.domain}</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">
                                    Sales Rep
                                </span>
                                <div>{visit.salesRep}</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">
                                    Customer Contact
                                </span>
                                <div>{visit.customerContact}</div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">
                                    Purpose
                                </span>
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
                        <div className="flex items-center justify-between mb-4">
                            <h3>
                                Attendees ({visit.attendees.length} /{" "}
                                {visit.capacity})
                            </h3>
                            {canVisitorJoin && (
                                <button
                                    onClick={handleSignUp}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm"
                                >
                                    <Users className="w-4 h-4" />
                                    Sign Up for This Visit
                                </button>
                            )}
                        </div>
                        {visit.attendees.length === 0 ? (
                            <div className="text-center py-12 bg-blue-50 rounded-lg border-2 border-blue-200 border-dashed">
                                <Users className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                                <p className="text-lg text-gray-700 mb-2 font-medium">
                                    No attendees yet
                                </p>
                                <p className="text-gray-500 mb-4">
                                    Be the first to join this visit!
                                </p>
                                {canVisitorJoin && (
                                    <button
                                        onClick={handleSignUp}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        Sign Up Now
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {visit.attendees.length >= visit.capacity && (
                                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                                        <span className="font-medium">
                                            ⚠️ This visit is at full capacity
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {visit.attendees.map((attendee, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                                                    {attendee.charAt(0)}
                                                </div>
                                                <span>{attendee}</span>
                                                {attendee === user.name && (
                                                    <span className="text-xs text-gray-500">
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                            {canManageVisit && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveAttendee(
                                                            attendee,
                                                        )
                                                    }
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

                    {canManageVisit && (
                        <div className="border-t pt-6">
                            <h3 className="mb-3">Visitor Restrictions</h3>
                            <label className="flex items-center justify-between gap-3">
                                <span className="text-sm">
                                    Restrict by Product Line
                                </span>
                                <Switch />
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
