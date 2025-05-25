import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
// import Spinner from '@/components/common/Spinner'; // No longer needed if submit button is in parent
import { PublicBookingFormData } from '@/types'; // For typing control

interface CustomerDetailsFormProps {
  control: Control<PublicBookingFormData>; // Accept control from parent
  errors: FieldErrors<PublicBookingFormData['customerDetails']>; // Specifically errors for customerDetails
  disabled?: boolean;
}

const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({ control, errors, disabled }) => {
  // Removed internal useForm, useEffect hooks, and internal submit handler
  // The component is now controlled by the parent form

  return (
    // Removed <form> tag, this is now part of the parent form
    <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">5. Your Details:</h2>
      
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
        <Controller
          name="customerDetails.name"
          control={control}
          render={({ field }) => (
            <input 
              type="text" 
              id="customerName" 
              {...field}
              disabled={disabled} 
              className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors?.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
              aria-invalid={errors?.name ? "true" : "false"}
            />
          )}
        />
        {errors?.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
        <Controller
          name="customerDetails.email"
          control={control}
          render={({ field }) => (
            <input 
              type="email" 
              id="customerEmail" 
              {...field}
              disabled={disabled} 
              className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors?.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
              aria-invalid={errors?.email ? "true" : "false"}
            />
          )}
        />
        {errors?.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
        <Controller
          name="customerDetails.phone"
          control={control}
          render={({ field }) => (
            <input 
              type="tel" 
              id="customerPhone" 
              {...field}
              disabled={disabled} 
              className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors?.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
              aria-invalid={errors?.phone ? "true" : "false"}
            />
          )}
        />
        {errors?.phone && <p role="alert" className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="bookingNotes" className="block text-sm font-medium text-gray-700">Notes for your booking (Optional)</label>
        <Controller
          name="customerDetails.notes"
          control={control}
          render={({ field }) => (
            <textarea 
              id="bookingNotes" 
              {...field}
              rows={3} 
              disabled={disabled} 
              className={`mt-1 w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed ${errors?.notes ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
              aria-invalid={errors?.notes ? "true" : "false"}
            />
          )}
        />
        {errors?.notes && <p role="alert" className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Removed the internal submit button. Parent form will handle submission. */}
    </div>
  );
};

export default CustomerDetailsForm;
