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
} from "lucide-react";
import { databases, client, ID } from "@/app/lib/appwrite";
import { Query } from "appwrite";

// Helper function to format date/time
const formatDate = (dateInput, options = {}) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

// Date comparison utilities
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isSameMonth = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "schedules"; // Ensure this matches your Appwrite collection ID

// --- 2. Real Appwrite Service Implementation ---
const appwriteService = {
  // Uses Real-Time Subscription
  onDocuments: (collectionId, callback, setErrorCallback) => {
    // Check if databases and required classes are available
    if (!databases || !client || !Query) {
      setErrorCallback(
        "Appwrite client not initialized. Check your configuration and SDK loading."
      );
      return () => {}; // Return no-op unsubscribe
    }

    // Function to fetch and process all documents
    const fetchAndCallback = async () => {
      try {
        // Fetch all documents. Ordering is done in-memory later.
        const response = await databases.listDocuments(
          DATABASE_ID,
          collectionId,
          [Query.orderAsc("date")]
        );
        callback(response.documents);
      } catch (e) {
        console.error("Appwrite initial fetch error:", e);
        // Include a helpful message if the database/collection ID might be wrong
        let errorMessage = e.message || "Unknown error";
        if (e.code === 404) {
          errorMessage = `Resource Not Found (Code 404). Double-check your DATABASE_ID (${DATABASE_ID}) and COLLECTION_ID (${COLLECTION_ID}).`;
        }
        setErrorCallback(`Failed to load data: ${errorMessage}.`);
      }
    };

    // 1. Run initial fetch
    fetchAndCallback();

    // 2. Set up real-time subscription
    // Subscribes to changes in this specific collection's documents
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${collectionId}.documents`,
      (response) => {
        // Re-fetch all documents whenever a change (create, update, delete) occurs
        console.log("Appwrite Realtime event received. Refetching data.");
        fetchAndCallback();
      }
    );

    // Return the unsubscribe function provided by the SDK
    return () => unsubscribe();
  },

  // Uses createDocument
  createDocument: async (collectionId, data) => {
    if (!databases || !ID)
      throw new Error("Appwrite client or required utilities not ready.");

    // Store date as ISO string for Appwrite attribute storage
    const payload = {
      ...data,
      date: new Date(data.date).toISOString(),
    };

    return databases.createDocument(
      DATABASE_ID,
      collectionId,
      ID.unique(),
      payload
    );
  },

  // Uses deleteDocument
  deleteDocument: async (collectionId, documentId) => {
    if (!databases) throw new Error("Appwrite client not ready.");
    return databases.deleteDocument(DATABASE_ID, collectionId, documentId);
  },
};

// --- Custom Components ---

// 3. Event Card Component (Using DaisyUI Card)
const EventCard = ({ event, handleDelete }) => (
  <div className="card w-full bg-base-100 shadow-xl border border-gray-100 hover:shadow-2xl transition duration-300">
    <div className="card-body p-4 sm:p-5 flex flex-row justify-between items-center">
      <div className="flex-grow">
        <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-600 flex items-center space-x-2 mt-1">
          <Clock size={16} className="text-success" />
          <span className="font-medium">
            {formatDate(event.date, {
              year: undefined,
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-xs text-gray-400">({event.duration} min)</span>
        </p>
      </div>
      <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
        <div
          className={`badge badge-sm font-semibold ${
            event.public ? "badge-primary" : "badge-neutral"
          }`}
        >
          {event.public ? "Public" : "Private"}
        </div>
        <button
          onClick={() => handleDelete(event.$id)} // Use $id for Appwrite document ID
          className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
          aria-label="Delete Event"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
);

// 4. Custom Calendar Component (Simulating react-day-picker features with DaisyUI)
const CalendarComponent = ({ events, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Calculates the days of the month to display (42-day grid)
  const daysInMonth = useMemo(() => {
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    // Start grid from the Sunday before the 1st of the month
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentMonth]);

  // Determine which days have events
  const daysWithEvents = useMemo(() => {
    const eventMap = new Map();
    events.forEach((event) => {
      // Appwrite returns $createdAt and $updatedAt as strings, so we re-parse dates here
      const eventDate = new Date(event.date);
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      eventMap.set(dateKey, true);
    });
    return eventMap;
  }, [events]);

  const goToPrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="card bg-base-100 shadow-xl p-5 w-full">
      <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
        <Calendar size={20} className="text-primary" />
        <span>Select Date</span>
      </h2>

      <div className="flex justify-between items-center mb-4">
        <button className="btn btn-sm btn-ghost" onClick={goToPrevMonth}>
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-lg">
          {currentMonth.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button className="btn btn-sm btn-ghost" onClick={goToNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">
        {dayLabels.map((day) => (
          <div key={day} className="p-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {daysInMonth.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);
          const hasEvents = daysWithEvents.has(
            `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          );

          let className = `btn btn-sm text-base-content border-none font-normal rounded-lg h-10 w-full p-0 relative`;

          if (!isCurrentMonth) {
            className +=
              " text-gray-400 opacity-60 pointer-events-none bg-base-200/50";
          } else {
            className += " btn-ghost hover:bg-primary/20";
          }

          if (isToday) {
            className += " font-bold text-primary border border-primary/50";
          }
          if (isSelected) {
            className = `btn btn-sm btn-primary text-white font-bold rounded-lg h-10 w-full p-0 z-10 shadow-lg`;
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => onDateSelect(date)}
              aria-label={`Select ${date.toDateString()}`}
              disabled={!isCurrentMonth}
            >
              {date.getDate()}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-1 right-1 h-1 w-1 bg-secondary rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Main Application Component
const App = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    duration: 30,
    public: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");

  // 5. Initialization and Data Fetching Effect (Using Real Appwrite Service)
  useEffect(() => {
    // Simulating Appwrite subscription to the schedules collection
    const unsubscribe = appwriteService.onDocuments(
      COLLECTION_ID,
      (fetchedDocs) => {
        // Map Appwrite document format to internal event structure
        const fetchedEvents = fetchedDocs.map((doc) => ({
          ...doc, // Includes $id, $createdAt, etc.
          date: new Date(doc.date), // Convert stored ISO string back to Date object
          duration: parseInt(doc.duration, 10),
        }));

        // Appwrite Query.orderAsc is used, but we double-check sorting in JS
        fetchedEvents.sort((a, b) => a.date - b.date);

        setEvents(fetchedEvents);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []); // Run once on component mount

  // Filtered Events based on selected date and view mode
  const filteredEvents = useMemo(() => {
    // If viewing by month, show all events within the selected month
    if (viewMode === "month") {
      return events.filter((event) => isSameMonth(event.date, selectedDate));
    }
    // If viewing by day, show all events on the selected day
    return events.filter((event) => isSameDay(event.date, selectedDate));
  }, [events, selectedDate, viewMode]);

  // 6. Appwrite Write Operations
  const handleAddEvent = useCallback(async () => {
    if (!databases) {
      setError("Appwrite service not ready. Cannot save data.");
      console.error("Appwrite service not ready. Cannot save data.");
      return;
    }
    if (!newEvent.title || !newEvent.date) {
      setError("Title and Date are required.");
      return;
    }

    const eventToSave = {
      title: newEvent.title,
      date: newEvent.date, // Will be converted to ISO string in createDocument
      duration: parseInt(newEvent.duration, 10),
      public: newEvent.public,
    };

    try {
      await appwriteService.createDocument(COLLECTION_ID, eventToSave);
      setNewEvent({ title: "", date: "", duration: 30, public: false });
      setShowModal(false);
      setError(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError(`Failed to add new event: ${e.message || "Unknown error"}.`);
    }
  }, [newEvent]);

  const handleDeleteEvent = useCallback(async (id) => {
    if (!databases) return;
    try {
      await appwriteService.deleteDocument(COLLECTION_ID, id);
      setError(null);
    } catch (e) {
      console.error("Error deleting document: ", e);
      setError(`Failed to delete event: ${e.message || "Unknown error"}.`);
    }
  }, []);

  // Loading UI (Using DaisyUI spinner and layout)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="flex flex-col items-center p-8 bg-base-100 rounded-xl shadow-xl">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-lg text-gray-600">
            Connecting to Appwrite...
          </p>
        </div>
      </div>
    );
  }

  // --- Main Render Structure ---
  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-8">
      {/* Header and Appwrite Notice */}
      <header className="mb-8 p-6 bg-base-100 rounded-2xl shadow-xl border-t-4 border-primary">
        <h1 className="text-4xl font-extrabold text-gray-800 flex items-center space-x-3">
          <ClipboardList size={32} className="text-primary" />
          <span>Appointments Scheduler</span>
        </h1>
        {/* <div className="text-sm text-gray-500 mt-2 p-2 bg-warning/20 border border-warning rounded-lg flex items-start space-x-2">
          <AlertTriangle
            size={18}
            className="text-warning-content flex-shrink-0 mt-0.5"
          />
          <p className="flex-grow">
            This app is now configured to connect to your Appwrite project
            (Database ID: <code>{DATABASE_ID}</code>, Collection:{" "}
            <code>{COLLECTION_ID}</code>). Please ensure your Appwrite instance
            is running and the collection has the required permissions.
          </p>
        </div> */}
      </header>

      {/* Main Content Grid: Calendar (1/3) and Events (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar Component */}
        <div className="lg:col-span-1">
          <CalendarComponent
            events={events}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              // Automatically switch to Day view when a specific date is clicked
              setViewMode("day");
            }}
          />
        </div>

        {/* Right Column: Event List and Controls */}
        <div className="lg:col-span-2">
          {/* Controls and Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-semibold text-gray-700">
              {viewMode === "day"
                ? `Appointments for ${formatDate(selectedDate, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: undefined,
                    minute: undefined,
                  })}`
                : `Appointments in ${selectedDate.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}`}
              <span className="ml-2 badge badge-lg badge-outline text-lg font-bold">
                {filteredEvents.length}
              </span>
            </h2>

            <div className="flex space-x-3">
              {/* View Mode Dropdown (DaisyUI Select) */}
              <select
                className="select select-bordered select-sm w-full max-w-xs text-base"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="month">Month View</option>
                <option value="day">Day View</option>
              </select>

              {/* New Event Button (DaisyUI Button) */}
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary btn-sm md:btn-md shadow-lg"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">New Appointment</span>
              </button>
            </div>
          </div>

          {/* Event List */}
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                // Use event.$id for Appwrite document ID
                <EventCard
                  key={event.$id}
                  event={event}
                  handleDelete={handleDeleteEvent}
                />
              ))
            ) : (
              <div className="text-center p-12 bg-base-100 rounded-xl shadow-inner text-gray-500 border border-dashed border-gray-300">
                <Calendar size={40} className="mx-auto mb-3" />
                <p className="text-lg">
                  No appointments scheduled for this{" "}
                  {viewMode === "day" ? "day" : "month"}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Error Display */}
      {error && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-error">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Modal for adding a new event (Using DaisyUI Modal) */}
      {showModal && (
        <dialog id="newEventModal" className="modal modal-open">
          <div className="modal-box w-full max-w-md p-6">
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>

            <h3 className="font-bold text-2xl text-gray-800 mb-4">
              Add New Appointment
            </h3>

            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label htmlFor="title" className="label font-medium pb-1">
                  Event Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Patient Checkup"
                  className="input input-bordered w-full"
                />
              </div>

              {/* Date/Time Input */}
              <div>
                <label htmlFor="date" className="label font-medium pb-1">
                  Date and Time
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent((p) => ({ ...p, date: e.target.value }))
                  }
                  className="input input-bordered w-full"
                />
              </div>

              {/* Duration Select */}
              <div>
                <label htmlFor="duration" className="label font-medium pb-1">
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  value={newEvent.duration}
                  onChange={(e) =>
                    setNewEvent((p) => ({ ...p, duration: e.target.value }))
                  }
                  className="select select-bordered w-full"
                >
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>

              {/* Public/Private Toggle */}
              <div className="form-control">
                <label
                  htmlFor="public"
                  className="label cursor-pointer justify-start space-x-3"
                >
                  <input
                    id="public"
                    type="checkbox"
                    checked={newEvent.public}
                    onChange={(e) =>
                      setNewEvent((p) => ({ ...p, public: e.target.checked }))
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text flex items-center space-x-1">
                    <Users size={16} className="text-primary/70" />
                    <span>Publicly Visible (Shareable)</span>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="modal-action mt-6">
                <button
                  onClick={handleAddEvent}
                  className="btn btn-primary shadow-lg"
                >
                  Save Appointment
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default App;
