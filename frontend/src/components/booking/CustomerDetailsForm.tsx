import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Spinner from '@/components/common/Spinner';

// Define Zod schema for validation
const customerDetailsSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100, { message: "Name cannot exceed 100 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional()
    // Basic phone validation: allows digits, spaces, hyphens, parentheses, and optional leading +
    // Adjust regex as needed for more specific international formats.
    .refine(val => !val || /^[+]?[0-9\s-()]{7,20}$/.test(val), {
      message: "Invalid phone number format (e.g., +1 123-456-7890)",
    }),
  notes: z.string().max(500, { message: "Notes cannot exceed 500 characters" }).optional(),
});

type CustomerFormValues = z.infer<typeof customerDetailsSchema>;

interface CustomerDetailsFormProps {
  onSubmit: (details: CustomerFormValues) => Promise<void>;
  initialDetails: { name: string; email: string; phone?: string };
  isSubmittingBooking: boolean;
  disabled?: boolean;
}

const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({ onSubmit, initialDetails, isSubmittingBooking, disabled }) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting: isFormInternalSubmitting }, 
    reset,
    setValue 
  } = useForm<CustomerFormValues>({
    defaultValues: { // Ensure defaultValues match the schema structure
        name: initialDetails.name || '',
        email: initialDetails.email || '',
        phone: initialDetails.phone || '',
        notes: '', // Notes usually start empty
    },
    resolver: zodResolver(customerDetailsSchema),
    mode: "onBlur", // Validate on blur for better UX
  });

  useEffect(() => {
    // Reset form with new initialDetails when they change (e.g., user logs in/out)
    // or if the component is re-rendered with different initial data.
    reset({
        name: initialDetails.name || '',
        email: initialDetails.email || '',
        phone: initialDetails.phone || '',
        notes: '', // Reset notes as well, or carry them over if needed
    });
  }, [initialDetails, reset]);
  
  // This effect might be redundant if defaultValues in useForm and the reset effect handle it.
  // Kept for explicit updates if initialDetails prop changes dynamically while form is mounted.
  useEffect(() => {
    setValue('name', initialDetails.name || '', { shouldValidate: false, shouldDirty: false });
    setValue('email', initialDetails.email || '', { shouldValidate: false, shouldDirty: false });
    setValue('phone', initialDetails.phone || '', { shouldValidate: false, shouldDirty: false });
  }, [initialDetails.name, initialDetails.email, initialDetails.phone, setValue]);


  const onFormSubmit: SubmitHandler<CustomerFormValues> = async (data) => {
    if (disabled || isSubmittingBooking) return;
    await onSubmit(data); // The parent component handles the actual API call and its loading state
  };

  const actualIsSubmitting = isSubmittingBooking || isFormInternalSubmitting;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-6 pt-6 border-t border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">5. Your Details:</h2>
      
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          id="customerName" 
          {...register("name")}
          disabled={disabled || actualIsSubmitting} 
          className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
          aria-invalid={errors.name ? "true" : "false"}
        />
        {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
        <input 
          type="email" 
          id="customerEmail" 
          {...register("email")}
          disabled={disabled || actualIsSubmitting} 
          className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
        <input 
          type="tel" 
          id="customerPhone" 
          {...register("phone")}
          disabled={disabled || actualIsSubmitting} 
          className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
          aria-invalid={errors.phone ? "true" : "false"}
        />
        {errors.phone && <p role="alert" className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="bookingNotes" className="block text-sm font-medium text-gray-700">Notes for your booking (Optional)</label>
        <textarea 
          id="bookingNotes" 
          {...register("notes")}
          rows={3} 
          disabled={disabled || actualIsSubmitting} 
          className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.notes ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
          aria-invalid={errors.notes ? "true" : "false"}
        />
        {errors.notes && <p role="alert" className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <button 
        type="submit" 
        disabled={actualIsSubmitting || disabled} 
        className="w-full btn btn-primary py-3 text-base disabled:opacity-70 flex items-center justify-center"
      >
        {actualIsSubmitting ? <><Spinner color="text-white" /> Processing...</> : 'Confirm Booking'}
      </button>
    </form>
  );
};

export default CustomerDetailsForm;
