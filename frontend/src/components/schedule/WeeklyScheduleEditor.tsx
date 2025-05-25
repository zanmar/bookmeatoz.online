import React, { useState, useEffect } from 'react';
import { WorkingHours, WorkingHourInput } from '@/types';
import Spinner from '@/components/common/Spinner';
import { useForm, useFieldArray, SubmitHandler, Controller, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from '@/utils/toast';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Schema for a single time block
const timeBlockSchema = z.object({
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM"),
}).refine(data => data.start_time < data.end_time, {
  message: "Start must be before end",
  path: ["end_time"],
});

// Schema for a single day's schedule (can have multiple time blocks or be off)
const dayScheduleEntrySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  is_off: z.boolean(),
  time_blocks: z.array(timeBlockSchema)
}).refine(data => { // Validate no overlaps within this day's time blocks
  if (data.is_off || data.time_blocks.length <= 1) return true;
  const sortedBlocks = [...data.time_blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    if (sortedBlocks[i].end_time > sortedBlocks[i+1].start_time) return false; // Overlap
  }
  return true;
}, {
  message: "Time blocks for the same day cannot overlap",
  path: ["time_blocks"],
});

const weeklyScheduleSchema = z.object({
  schedule: z.array(dayScheduleEntrySchema).length(7, "Schedule must cover all 7 days."),
});

type WeeklyScheduleFormValues = z.infer<typeof weeklyScheduleSchema>;
type DayScheduleFormEntry = WeeklyScheduleFormValues['schedule'][0];

interface WeeklyScheduleEditorProps {
  initialHours: WorkingHours[]; // From backend (multiple rows can exist for same day_of_week)
  onSave: (hours: WorkingHourInput[]) => Promise<void>; // Expects flattened array for backend
  employeeTimezone: string;
}

const TimeBlockInputs: React.FC<{
    nestIndex: number; // Index of the day in the week
    control: Control<WeeklyScheduleFormValues>;
    register: any; // From useForm
    dayIsOff: boolean;
    errors: any; // Errors for this day's schedule
}> = ({ nestIndex, control, register, dayIsOff, errors }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `schedule.${nestIndex}.time_blocks`
    });

    return (
        <div className="space-y-3 pl-4 border-l-2 border-gray-200 ml-1">
            {fields.map((item, k) => (
                <div key={item.id} className="flex items-end space-x-2">
                    <div className="flex-1">
                        <label htmlFor={`schedule.${nestIndex}.time_blocks.${k}.start_time`} className="block text-xs font-medium text-gray-500">Start</label>
                        <input
                            type="time"
                            step="900" // 15-min
                            {...register(`schedule.${nestIndex}.time_blocks.${k}.start_time`)}
                            disabled={dayIsOff}
                            className={`mt-1 block w-full p-2 border rounded-md shadow-sm sm:text-sm disabled:bg-gray-100 ${errors?.schedule?.[nestIndex]?.time_blocks?.[k]?.start_time ? 'border-red-500' : 'border-gray-300'}`}
                        />
                         {errors?.schedule?.[nestIndex]?.time_blocks?.[k]?.start_time && <p className="mt-1 text-xs text-red-600">{errors.schedule[nestIndex].time_blocks[k].start_time.message}</p>}
                    </div>
                    <div className="flex-1">
                        <label htmlFor={`schedule.${nestIndex}.time_blocks.${k}.end_time`} className="block text-xs font-medium text-gray-500">End</label>
                        <input
                            type="time"
                            step="900"
                            {...register(`schedule.${nestIndex}.time_blocks.${k}.end_time`)}
                            disabled={dayIsOff}
                            className={`mt-1 block w-full p-2 border rounded-md shadow-sm sm:text-sm disabled:bg-gray-100 ${errors?.schedule?.[nestIndex]?.time_blocks?.[k]?.end_time || errors?.schedule?.[nestIndex]?.time_blocks?.[k]?.message ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors?.schedule?.[nestIndex]?.time_blocks?.[k]?.end_time && <p className="mt-1 text-xs text-red-600">{errors.schedule[nestIndex].time_blocks[k].end_time.message}</p>}
                        {errors?.schedule?.[nestIndex]?.time_blocks?.[k]?.message && <p className="mt-1 text-xs text-red-600">{errors.schedule[nestIndex].time_blocks[k].message}</p>}
                    </div>
                    <button type="button" onClick={() => remove(k)} disabled={dayIsOff} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ))}
             {errors?.schedule?.[nestIndex]?.time_blocks?.message && <p className="mt-1 text-xs text-red-600">{errors.schedule[nestIndex].time_blocks.message}</p>}

            <button
                type="button"
                onClick={() => append({ start_time: "09:00", end_time: "17:00" })}
                disabled={dayIsOff}
                className="mt-2 text-xs text-primary hover:text-primary-dark font-medium disabled:opacity-50"
            >
                + Add Time Block
            </button>
        </div>
    );
};


const WeeklyScheduleEditor: React.FC<WeeklyScheduleEditorProps> = ({ initialHours, onSave, employeeTimezone }) => {
  const { control, register, handleSubmit, watch, setValue, formState: { errors, isSubmitting: isFormInternalSubmitting }, reset } = useForm<WeeklyScheduleFormValues>({
    resolver: zodResolver(weeklyScheduleSchema),
    mode: "onBlur",
  });

  const { fields } = useFieldArray({ control, name: "schedule" });
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const groupedByDay: Record<number, WorkingHourInput[]> = {};
    initialHours.forEach(h => {
      if (!groupedByDay[h.day_of_week]) groupedByDay[h.day_of_week] = [];
      groupedByDay[h.day_of_week].push({
        day_of_week: h.day_of_week,
        start_time: h.is_off ? "09:00" : (h.start_time || "09:00").substring(0,5),
        end_time: h.is_off ? "17:00" : (h.end_time || "17:00").substring(0,5),
        is_off: h.is_off || false,
      });
    });

    const newScheduleValues = daysOfWeek.map((_, index) => {
      const dayEntries = groupedByDay[index];
      if (dayEntries && dayEntries.length > 0 && !dayEntries[0].is_off) { // Assuming if any entry is not is_off, the day is not off
        return {
          day_of_week: index,
          is_off: false,
          time_blocks: dayEntries.map(de => ({ start_time: de.start_time, end_time: de.end_time })).sort((a,b) => a.start_time.localeCompare(b.start_time)),
        };
      }
      // If day is off or no entries, default to off
      return { day_of_week: index, is_off: true, time_blocks: [{ start_time: "09:00", end_time: "17:00" }] };
    });
    reset({ schedule: newScheduleValues });
  }, [initialHours, reset]);

  const onFormSubmitHandler: SubmitHandler<WeeklyScheduleFormValues> = async (data) => {
    setApiError(null);
    // Transform data.schedule (which has time_blocks array for each day)
    // into a flat array of WorkingHourInput for the backend
    const flattenedSchedule: WorkingHourInput[] = data.schedule.flatMap(dayEntry => {
      if (dayEntry.is_off) {
        return [{ day_of_week: dayEntry.day_of_week, start_time: "00:00", end_time: "00:00", is_off: true }];
      }
      return dayEntry.time_blocks.map(block => ({
        day_of_week: dayEntry.day_of_week,
        start_time: block.start_time,
        end_time: block.end_time,
        is_off: false,
      }));
    });

    try {
      await onSave(flattenedSchedule);
      toast.success('Weekly schedule saved successfully!');
    } catch (err: any) {
      setApiError(err.message || "Failed to save schedule.");
      toast.error(err.message || "Failed to save schedule.");
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onFormSubmitHandler)} className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
            Define standard weekly availability. Times are in business timezone: <span className="font-medium">{employeeTimezone.replace('_', ' ')}</span>.
        </p>
        {/* Conceptual: Copy Schedule Button
            <button type="button" onClick={() => {/* Implement copy logic * /}} className="text-xs btn btn-outline">
                Copy From...
            </button>
        */}
      </div>
      {apiError && <div role="alert" className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">{apiError}</div>}
      {errors.schedule?.root?.message && <div role="alert" className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">{errors.schedule.root.message}</div>}
      
      {fields.map((field, index) => {
        const dayIsOff = watch(`schedule.${index}.is_off`);
        return (
          <div key={field.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-700 w-28">{daysOfWeek[index]}</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`schedule.${index}.is_off`}
                  {...register(`schedule.${index}.is_off`)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`schedule.${index}.is_off`} className="ml-2 text-sm text-gray-600">
                  Day Off
                </label>
              </div>
            </div>
            {!dayIsOff && (
              <TimeBlockInputs 
                nestIndex={index} 
                control={control} 
                register={register} 
                dayIsOff={dayIsOff}
                errors={errors}
              />
            )}
          </div>
        );
      })}
      <div className="pt-5">
        <button
          type="submit"
          disabled={isFormInternalSubmitting}
          className="w-full sm:w-auto flex justify-center items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70"
        >
          {isFormInternalSubmitting ? <><Spinner size="h-5 w-5 mr-2" color="text-white"/> Saving...</> : 'Save Weekly Schedule'}
        </button>
      </div>
    </form>
  );
};

export default WeeklyScheduleEditor;
