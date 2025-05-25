import React, { useState, useEffect } from 'react';
import { EmployeeAvailabilityOverride, AvailabilityOverrideInput, WorkingHourInput } from '@/types'; // Added WorkingHourInput
import Spinner from '@/components/common/Spinner';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds, getDay as getDayFns, isEqual, isWithinInterval } from 'date-fns'; // Added more date-fns
import { utcToZonedTime, zonedTimeToUtc, format as formatWithTZ } from 'date-fns-tz';
import toast from '@/utils/toast';

// Zod Schema for Override Form (as defined before)
const overrideFormSchema = z.object({
  startDate: z.date({ required_error: "Start date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)."),
  endDate: z.date({ required_error: "End date is required." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)."),
  is_unavailable: z.boolean(),
  reason: z.string().max(255, "Reason cannot exceed 255 characters.").optional(),
}).refine(data => {
    const [startH, startM] = data.startTime.split(':').map(Number);
    const fullStartDate = setMilliseconds(setSeconds(setMinutes(setHours(data.startDate, startH), startM),0),0);
    const [endH, endM] = data.endTime.split(':').map(Number);
    const fullEndDate = setMilliseconds(setSeconds(setMinutes(setHours(data.endDate, endH), endM),0),0);
    return fullEndDate.getTime() > fullStartDate.getTime();
}, {
  message: "End date/time must be after start date/time.",
  path: ["endDate"], 
});
type OverrideFormValues = z.infer<typeof overrideFormSchema>;


interface OverrideFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AvailabilityOverrideInput) => Promise<void>;
  initialData?: EmployeeAvailabilityOverride | null;
  employeeTimezone: string;
  currentWeeklySchedule?: WorkingHourInput[]; // Pass weekly schedule for conflict preview
}

const OverrideFormModal: React.FC<OverrideFormModalProps> = ({ 
    isOpen, onClose, onSubmit, initialData, employeeTimezone, currentWeeklySchedule 
}) => {
  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting: isFormInternalSubmitting } } = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideFormSchema),
    mode: "onBlur",
    defaultValues: { is_unavailable: true, reason: '', startTime: "09:00", endTime: "17:00" }
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [clientConflictWarning, setClientConflictWarning] = useState<string | null>(null);

  const watchedStartDate = watch("startDate");
  const watchedStartTime = watch("startTime");
  const watchedEndDate = watch("endDate");
  const watchedEndTime = watch("endTime");
  const watchedIsUnavailable = watch("is_unavailable");

  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      setClientConflictWarning(null);
      if (initialData) {
        const startUTC = parseISO(initialData.start_time as unknown as string);
        const endUTC = parseISO(initialData.end_time as unknown as string);
        const startInBusinessTZ = utcToZonedTime(startUTC, employeeTimezone);
        const endInBusinessTZ = utcToZonedTime(endUTC, employeeTimezone);
        reset({
          startDate: startInBusinessTZ,
          startTime: formatWithTZ(startInBusinessTZ, 'HH:mm', { timeZone: employeeTimezone }),
          endDate: endInBusinessTZ,
          endTime: formatWithTZ(endInBusinessTZ, 'HH:mm', { timeZone: employeeTimezone }),
          is_unavailable: initialData.is_unavailable,
          reason: initialData.reason || "",
        });
      } else {
        const todayInBusinessTZ = utcToZonedTime(new Date(), employeeTimezone);
        reset({
          startDate: todayInBusinessTZ, startTime: "09:00",
          endDate: todayInBusinessTZ, endTime: "17:00",
          is_unavailable: true, reason: "",
        });
      }
    }
  }, [isOpen, initialData, employeeTimezone, reset]);

  // Client-Side Conflict Preview Logic
  useEffect(() => {
    if (!isOpen || !currentWeeklySchedule || !watchedStartDate || !watchedStartTime || watchedIsUnavailable === true) {
      setClientConflictWarning(null);
      return; // Only check for "Special Availability" against weekly "Day Off"
    }

    const [startH, startM] = watchedStartTime.split(':').map(Number);
    const proposedStartLocal = setMilliseconds(setSeconds(setMinutes(setHours(new Date(watchedStartDate), startH), startM),0),0);
    const dayOfWeek = getDayFns(proposedStartLocal); // 0 for Sunday, 6 for Saturday

    const weeklyDaySetting = currentWeeklySchedule.find(d => d.day_of_week === dayOfWeek);

    if (weeklyDaySetting?.is_off) {
      setClientConflictWarning(null); // It's fine, this is making a day off available
    } else if (weeklyDaySetting) {
      // Check if the proposed special availability (start time only for simplicity here)
      // falls outside the regular working hours for that day.
      const workStart = parseTime(weeklyDaySetting.start_time);
      const workEnd = parseTime(weeklyDaySetting.end_time);
      
      const proposedStartHour = proposedStartLocal.getHours();
      const proposedStartMinute = proposedStartLocal.getMinutes();

      if (
        (proposedStartHour < workStart.hours || (proposedStartHour === workStart.hours && proposedStartMinute < workStart.minutes)) ||
        (proposedStartHour > workEnd.hours || (proposedStartHour === workEnd.hours && proposedStartMinute >= workEnd.minutes)) 
        // This check is simplified, a full interval overlap check would be more robust
      ) {
        setClientConflictWarning("Note: This special availability is outside the regular working hours for this day.");
      } else {
        setClientConflictWarning(null);
      }
    } else {
      setClientConflictWarning("Note: No regular weekly schedule found for this day to compare against.");
    }

  }, [watchedStartDate, watchedStartTime, watchedIsUnavailable, currentWeeklySchedule, isOpen]);


  const onFormSubmitHandler: SubmitHandler<OverrideFormValues> = async (data) => {
    setApiError(null);
    const [startH, startM] = data.startTime.split(':').map(Number);
    let localStartDate = setMilliseconds(setSeconds(setMinutes(setHours(data.startDate, startH), startM),0),0);
    const [endH, endM] = data.endTime.split(':').map(Number);
    let localEndDate = setMilliseconds(setSeconds(setMinutes(setHours(data.endDate, endH), endM),0),0);
    const startUTCiso = zonedTimeToUtc(localStartDate, employeeTimezone).toISOString();
    const endUTCiso = zonedTimeToUtc(localEndDate, employeeTimezone).toISOString();

    try {
      await onSubmit({
        start_time: startUTCiso, end_time: endUTCiso,
        is_unavailable: data.is_unavailable, reason: data.reason,
      });
      onClose();
    } catch (err: any) {
      setApiError(err.message || "Failed to save override.");
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-xl rounded-xl bg-white">
        <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-6">
          {initialData ? 'Edit Availability Override' : 'Add New Override'}
        </h3>
        {apiError && <div role="alert" className="p-3 mb-4 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">{apiError}</div>}
        {clientConflictWarning && <div role="alert" className="p-3 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">{clientConflictWarning}</div>}
        
        <form onSubmit={handleSubmit(onFormSubmitHandler)} className="space-y-4">
          {/* UX for Time Input: Conceptual Note
              Consider replacing separate Date and Time inputs with a single DateTime picker component.
              Libraries like `react-datepicker` support `showTimeSelect` for this.
              This would simplify the form schema (e.g., `startDateTime: z.date()`) and state.
              Example with react-datepicker:
              <Controller name="startDateTime" control={control} render={({ field }) => (
                <DatePickerComponent
                  selected={field.value}
                  onChange={field.onChange}
                  showTimeSelect
                  timeFormat="HH:mm" // or "h:mm aa"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="your-tailwind-classes"
                  placeholderText="Select start date and time"
                />
              )}/>
            */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <Controller name="startDate" control={control} render={({ field }) => (
                  <DatePickerComponent selected={field.value} onChange={(date) => field.onChange(date)} dateFormat="MMMM d, yyyy" minDate={new Date()} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`} wrapperClassName="w-full" placeholderText="Select start date" />
              )}/>
              {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
              <input type="time" id="startTime" {...register("startTime")} step="900" /* 15 min step */ className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <Controller name="endDate" control={control} render={({ field }) => (
                  <DatePickerComponent selected={field.value} onChange={(date) => field.onChange(date)} dateFormat="MMMM d, yyyy" minDate={watchedStartDate || new Date()} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.endDate || errors.root?.message ? 'border-red-500' : 'border-gray-300'}`} wrapperClassName="w-full" placeholderText="Select end date" />
              )}/>
              {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>}
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
              <input type="time" id="endTime" {...register("endTime")} step="900" /* 15 min step */ className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.endTime || errors.root?.message ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p>}
            </div>
          </div>
          {errors.root?.message && <p className="mt-1 text-xs text-red-600">{errors.root.message}</p>}
          <div className="pt-2">
            <label htmlFor="is_unavailable" className="block text-sm font-medium text-gray-700">Type of Override</label>
            <select id="is_unavailable" {...register("is_unavailable", {setValueAs: v => v === 'true'})} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.is_unavailable ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="true">Unavailable (Time Off / Break)</option>
              <option value="false">Special Availability</option>
            </select>
            {errors.is_unavailable && <p className="mt-1 text-xs text-red-600">{errors.is_unavailable.message}</p>}
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
            <input type="text" id="reason" {...register("reason")} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.reason ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
          </div>
          <p className="text-xs text-gray-500">All dates and times are interpreted based on the business timezone: <span className="font-medium">{employeeTimezone.replace('_', ' ')}</span>. Stored in UTC.</p>
          <div className="flex justify-end space-x-3 pt-5">
            <button type="button" onClick={onClose} disabled={isFormInternalSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isFormInternalSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark border border-transparent rounded-lg shadow-sm disabled:opacity-70 flex items-center">
              {isFormInternalSubmitting && <Spinner size="h-4 w-4 mr-2" color="text-white" />}
              {isFormInternalSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Override')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AvailabilityOverridesManagerProps {
  overrides: EmployeeAvailabilityOverride[];
  onAddOverride: (data: AvailabilityOverrideInput) => Promise<void>;
  onUpdateOverride: (overrideId: string, data: Partial<AvailabilityOverrideInput>) => Promise<void>;
  onDeleteOverride: (overrideId: string) => Promise<void>;
  employeeTimezone: string;
  currentWeeklySchedule?: WorkingHourInput[]; // Pass from parent page
}

const AvailabilityOverridesManager: React.FC<AvailabilityOverridesManagerProps> = ({ 
  overrides, onAddOverride, onUpdateOverride, onDeleteOverride, employeeTimezone, currentWeeklySchedule 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<EmployeeAvailabilityOverride | null>(null);
  // State for FullCalendar events (conceptual)
  // const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // useEffect(() => {
  //   // Convert overrides to FullCalendar event format
  //   const events = overrides.map(ov => ({
  //     id: ov.id,
  //     title: ov.reason || (ov.is_unavailable ? 'Unavailable' : 'Special Availability'),
  //     start: utcToZonedTime(parseISO(ov.start_time as unknown as string), employeeTimezone), // Display in business TZ
  //     end: utcToZonedTime(parseISO(ov.end_time as unknown as string), employeeTimezone),
  //     backgroundColor: ov.is_unavailable ? '#ef4444' : '#22c55e', // Red for unavailable, Green for available
  //     borderColor: ov.is_unavailable ? '#dc2626' : '#16a34a',
  //     extendedProps: ov, // Store original override data
  //   }));
  //   setCalendarEvents(events);
  // }, [overrides, employeeTimezone]);


  const handleOpenModal = (override?: EmployeeAvailabilityOverride) => {
    setEditingOverride(override || null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: AvailabilityOverrideInput) => {
    try {
        if (editingOverride) {
        await onUpdateOverride(editingOverride.id, data);
        } else {
        await onAddOverride(data);
        }
        // Parent page (ManageEmployeeSchedulePage) handles success toast
    } catch (error) {
        // Parent page handles error toast, or modal can show its own via apiError state
        throw error; // Re-throw for modal to catch if needed
    }
  };

  const formatDateRangeForDisplay = (startISO: string | Date, endISO: string | Date, tz: string) => {
    try {
      const startInBusinessTZ = utcToZonedTime(new Date(startISO), tz);
      const endInBusinessTZ = utcToZonedTime(new Date(endISO), tz);
      const optionsDate: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      const optionsTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz };
      
      const startDateStr = startInBusinessTZ.toLocaleDateString(undefined, optionsDate);
      const endDateStr = endInBusinessTZ.toLocaleDateString(undefined, optionsDate);
      const startTimeStr = formatWithTZ(startInBusinessTZ, 'p', { timeZone: tz });
      const endTimeStr = formatWithTZ(endInBusinessTZ, 'p', { timeZone: tz });

      if (startDateStr === endDateStr) {
        return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
      }
      return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
    } catch (e) {
        console.error("Error formatting date range for display:", e);
        return "Invalid date range";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Manage specific dates/times when the employee is unavailable or has special hours.</p>
        <button onClick={() => handleOpenModal()} className="btn btn-secondary text-sm py-2 px-3">
          Add Override
        </button>
      </div>
      
      {/* --- Visual Calendar for Overrides - Conceptual Integration ---
      <div className="my-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-600 font-medium text-center mb-2">Visual Calendar (FullCalendar Integration Placeholder)</p>
        <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
          {/* To integrate FullCalendar:
            1. Install: `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction`
            2. Import: `import FullCalendar from '@fullcalendar/react';`
                       `import dayGridPlugin from '@fullcalendar/daygrid';`
                       `import timeGridPlugin from '@fullcalendar/timegrid';`
                       `import interactionPlugin from '@fullcalendar/interaction';` // For dateClick, eventClick
            3. Render:
               <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth" // or 'timeGridWeek'
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents} // Mapped from 'overrides' state
                  eventClick={(clickInfo) => {
                    // clickInfo.event.extendedProps contains the original override object
                    handleOpenModal(clickInfo.event.extendedProps as EmployeeAvailabilityOverride);
                  }}
                  dateClick={(arg) => {
                    // arg.dateStr is 'YYYY-MM-DD'
                    // Open 'Add Override' modal, pre-filling startDate
                    const newOverrideBase = { startDate: arg.date, startTime: "09:00", endDate: arg.date, endTime: "17:00", is_unavailable: true, reason: "" };
                    // Need to convert arg.date (which is local to user) to business timezone for prefill
                    const dateInBusinessTZ = utcToZonedTime(arg.date, employeeTimezone);
                    setEditingOverride(null); // Ensure it's a new override
                    // Manually trigger modal with prefilled date (modal's useEffect will handle it)
                    // This part needs a bit more logic to pass prefilled date to modal's reset.
                    setIsModalOpen(true); 
                    console.log("Date clicked:", arg.dateStr);
                  }}
                  editable={true} // Allows dragging/resizing events (would need backend update)
                  eventDrop={(dropInfo) => { /* Handle event drag & drop, call onUpdateOverride */ /*}}
                  eventResize={(resizeInfo) => { /* Handle event resize, call onUpdateOverride */ /*}}
                  timeZone={employeeTimezone} // Important: Tell FullCalendar the timezone for events
                  displayEventTime={true}
                  eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
               />
          * /}
          <p className="text-gray-400 text-sm">FullCalendar would render here.</p>
        </div>
      </div>
      */}

      {overrides.length === 0 ? (
        <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">No overrides scheduled.</p>
      ) : (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Scheduled Overrides:</h3>
          <ul className="space-y-3">
            {overrides.map(ov => (
              <li key={ov.id} className="p-4 border rounded-lg shadow-sm bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-start">
                <div className="mb-2 sm:mb-0 flex-grow">
                  <p className={`font-semibold text-sm ${ov.is_unavailable ? 'text-orange-700' : 'text-green-700'}`}>
                    {ov.is_unavailable ? 'Unavailable' : 'Special Availability'}
                  </p>
                  <p className="text-xs text-gray-700">{formatDateRangeForDisplay(ov.start_time, ov.end_time, employeeTimezone)}</p>
                  {ov.reason && <p className="text-xs text-gray-500 italic mt-0.5">Reason: {ov.reason}</p>}
                </div>
                <div className="flex-shrink-0 space-x-2 self-start sm:self-center mt-2 sm:mt-0">
                  <button onClick={() => handleOpenModal(ov)} className="text-xs font-medium text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded">Edit</button>
                  <button onClick={() => onDeleteOverride(ov.id)} className="text-xs font-medium text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <OverrideFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingOverride}
        employeeTimezone={employeeTimezone}
        currentWeeklySchedule={currentWeeklySchedule}
      />
    </div>
  );
};

export default AvailabilityOverridesManager;
