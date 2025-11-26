import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  Users,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { databases, client, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";
import toast, { Toaster } from "react-hot-toast";

/* ----------------------------------------------------------
    Helper Functions
---------------------------------------------------------- */

const formatDate = (dateInput, options = {}) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameMonth = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth();

const isSameWeek = (d1, d2) => {
  const weekStart = new Date(d2);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return d1 >= weekStart && d1 <= weekEnd;
};

const getWeekRange = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

/* ----------------------------------------------------------
    Appwrite Config
---------------------------------------------------------- */

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "schedules";

const appwriteService = {
  onDocuments: (collectionId, callback, setError) => {
    if (!databases || !client) {
      setError("Appwrite not initialized.");
      return () => {};
    }

    const fetchDocs = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, collectionId, [
          Query.orderAsc("date"),
        ]);
        callback(res.documents);
      } catch (e) {
        setError(`Error: ${e.message}`);
      }
    };

    fetchDocs();

    const unsub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${collectionId}.documents`,
      fetchDocs
    );

    return () => unsub();
  },

  createDocument: async (collectionId, data) => {
    return databases.createDocument(DATABASE_ID, collectionId, ID.unique(), {
      ...data,
      date: new Date(data.date).toISOString(),
    });
  },

  deleteDocument: async (collectionId, docId) => {
    return databases.deleteDocument(DATABASE_ID, collectionId, docId);
  },
};

/* ----------------------------------------------------------
    Event Card
---------------------------------------------------------- */

const EventCard = ({ event, handleDelete }) => (
  <div className="card w-full bg-base-100 shadow-lg border border-gray-100 hover:shadow-xl transition">
    <div className="card-body p-5 flex flex-row justify-between items-center">
      <div className="flex-grow">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
          <Clock size={14} className="text-success" />
          <span>{formatDate(event.date)}</span>
          <span className="text-xs text-gray-400">({event.duration} min)</span>
        </p>
      </div>

      <div className="flex flex-col items-end space-y-1 ml-4">
        <div
          className={`badge badge-sm ${
            event.public ? "badge-primary" : "badge-neutral"
          }`}
        >
          {event.public ? "Public" : "Private"}
        </div>

        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={() => handleDelete(event.$id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

/* ----------------------------------------------------------
    Calendar Component
---------------------------------------------------------- */

const CalendarComponent = ({ events, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const daysInMonth = useMemo(() => {
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentMonth]);

  const eventMap = useMemo(() => {
    const map = new Map();

    events.forEach((e) => {
      const d = new Date(e.date);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(k, (map.get(k) || 0) + 1);
    });

    return map;
  }, [events]);

  return (
    <div className="card bg-base-100 shadow-xl p-5 w-full">
      <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
        <Calendar size={20} className="text-primary" />
        <span>Select Date</span>
      </h2>

      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-3">
        <button
          className="btn btn-sm btn-ghost"
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
        >
          <ChevronLeft />
        </button>

        <span className="font-medium text-lg">
          {currentMonth.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>

        <button
          className="btn btn-sm btn-ghost"
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
        >
          <ChevronRight />
        </button>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mt-1">
        {daysInMonth.map((date, i) => {
          const isCurrent = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);

          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const eventCount = eventMap.get(key) || 0;

          let cls = "relative btn btn-sm h-10 w-full text-sm border-none";

          if (!isCurrent)
            cls += " text-gray-400 opacity-50 bg-base-200 pointer-events-none";
          else cls += " btn-ghost hover:bg-primary/20";

          if (isToday) cls += " text-primary border border-primary/40";
          if (isSelected) cls = "btn btn-primary text-white h-10 relative";

          return (
            <button key={i} className={cls} onClick={() => onDateSelect(date)}>
              {date.getDate()}

              {/* Event Markers Rule #3 */}
              {eventCount === 1 && !isSelected && (
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
              )}
              {eventCount > 1 && !isSelected && (
                <span className="absolute bottom-1 right-1 bg-secondary text-white text-[10px] px-1 py-0.5 rounded-full">
                  {eventCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
    MAIN APP
---------------------------------------------------------- */

const App = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    duration: 30,
    public: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);

  const [error, setError] = useState(null);

  /* ----------------------------------------------------------
      Appwrite Subscription
  ---------------------------------------------------------- */

  useEffect(() => {
    const unsub = appwriteService.onDocuments(
      COLLECTION_ID,
      (docs) => {
        const mapped = docs.map((d) => ({
          ...d,
          date: new Date(d.date),
        }));

        mapped.sort((a, b) => a.date - b.date);

        setEvents(mapped);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsub;
  }, []);

  /* ----------------------------------------------------------
      Weekly View Helpers
  ---------------------------------------------------------- */

  const weekRange = getWeekRange(selectedDate);

  const weekEvents = useMemo(() => {
    return events.filter((e) => isSameWeek(e.date, selectedDate));
  }, [events, selectedDate]);

  /* ----------------------------------------------------------
      Filtered Events
  ---------------------------------------------------------- */

  const filteredEvents = useMemo(() => {
    if (viewMode === "week") return weekEvents;

    if (viewMode === "day")
      return events.filter((e) => isSameDay(e.date, selectedDate));

    return events.filter((e) => isSameMonth(e.date, selectedDate));
  }, [events, viewMode, selectedDate]);

  /* ----------------------------------------------------------
      Conflict Detection (A + C)
  ---------------------------------------------------------- */

  const hasConflict = (newEvt) => {
    const newStart = new Date(newEvt.date);
    const newEnd = new Date(newStart.getTime() + newEvt.duration * 60000);

    return events.some((e) => {
      if (!isSameDay(e.date, newStart)) return false;

      const start = new Date(e.date);
      const end = new Date(start.getTime() + e.duration * 60000);

      return newStart < end && newEnd > start;
    });
  };

  /* ----------------------------------------------------------
      Add Event
  ---------------------------------------------------------- */

  const attemptAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error("Title and date are required.");
      return;
    }

    // Conflict detected
    if (hasConflict(newEvent)) {
      setPendingEvent(newEvent);
      setShowConflictModal(true);
      return;
    }

    // No conflict → proceed
    saveEvent(newEvent);
  };

  const saveEvent = async (evt) => {
    try {
      setIsSaving(true);
      toast.loading("Saving...", { id: "saving" });

      await appwriteService.createDocument(COLLECTION_ID, evt);

      toast.success("Appointment added!", { id: "saving" });
      setShowModal(false);
      setShowConflictModal(false);

      setNewEvent({
        title: "",
        date: "",
        duration: 30,
        public: false,
      });

      setPendingEvent(null);
    } catch (e) {
      toast.error("Failed: " + e.message, { id: "saving" });
    } finally {
      setIsSaving(false);
    }
  };

  /* ----------------------------------------------------------
      Delete Event
  ---------------------------------------------------------- */

  const confirmDelete = (id) => setDeleteId(id);

  const performDelete = async () => {
    try {
      setIsDeleting(true);
      toast.loading("Deleting...", { id: "del" });

      await appwriteService.deleteDocument(COLLECTION_ID, deleteId);

      toast.success("Deleted!", { id: "del" });
      setDeleteId(null);
    } catch (e) {
      toast.error("Delete failed: " + e.message, { id: "del" });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ----------------------------------------------------------
      Loading Screen
  ---------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-200">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  /* ----------------------------------------------------------
      Render
  ---------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <Toaster />

      {/* Header */}
      <header className="mb-8 p-6 bg-base-100 rounded-xl shadow-xl border-t-4 border-primary">
        <h1 className="text-3xl font-bold flex items-center space-x-3">
          <ClipboardList className="text-primary" size={32} />
          <span>Appointments Scheduler</span>
        </h1>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CalendarComponent
          events={events}
          selectedDate={selectedDate}
          onDateSelect={(d) => {
            setSelectedDate(d);
            setViewMode("day");
          }}
        />

        {/* Events Panel */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold flex items-center space-x-3">
                <span>
                  {viewMode === "day" &&
                    `Appointments for ${selectedDate.toDateString()}`}
                  {viewMode === "month" &&
                    `Appointments in ${selectedDate.toLocaleString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}`}
                  {viewMode === "week" &&
                    `Week: ${weekRange.start.toLocaleDateString()} - ${weekRange.end.toLocaleDateString()}`}
                </span>

                <span className="badge badge-outline badge-lg">
                  {filteredEvents.length}
                </span>
              </h2>
            </div>

            <div className="flex space-x-3">
              <select
                className="select select-bordered select-sm"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
              </select>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          {viewMode === "week" && (
            <div className="flex justify-between mb-4">
              <button
                className="btn btn-sm"
                onClick={() =>
                  setSelectedDate(
                    new Date(selectedDate.setDate(selectedDate.getDate() - 7))
                  )
                }
              >
                <ChevronLeft size={16} />
                Previous Week
              </button>
              <button
                className="btn btn-sm"
                onClick={() =>
                  setSelectedDate(
                    new Date(selectedDate.setDate(selectedDate.getDate() + 7))
                  )
                }
              >
                Next Week
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.length ? (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.$id}
                  event={event}
                  handleDelete={confirmDelete}
                />
              ))
            ) : (
              <div className="p-10 bg-base-100 rounded-xl text-center">
                <Calendar size={40} className="mx-auto mb-3" />
                <p>No appointments for this {viewMode}.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">Add Appointment</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                className="input input-bordered w-full"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, title: e.target.value }))
                }
              />

              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, date: e.target.value }))
                }
              />

              <select
                className="select select-bordered w-full"
                value={newEvent.duration}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, duration: e.target.value }))
                }
              >
                {[15, 30, 45, 60, 90, 120].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={newEvent.public}
                  onChange={(e) =>
                    setNewEvent((p) => ({
                      ...p,
                      public: e.target.checked,
                    }))
                  }
                />
                <span>Publicly visible</span>
              </label>

              <button
                className="btn btn-primary w-full"
                onClick={attemptAddEvent}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                Save
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Conflict Modal */}
      {showConflictModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-xl font-bold mb-3">Time Conflict</h3>
            <p className="mb-6">
              This appointment overlaps with an existing one. Do you want to
              save it anyway?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                className="btn"
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingEvent(null);
                }}
              >
                Cancel
              </button>

              <button
                className="btn btn-warning"
                onClick={() => saveEvent(pendingEvent)}
              >
                Save Anyway
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete this appointment?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                className="btn"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="btn btn-error"
                onClick={performDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                )}
                Delete
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default App;
