// /var/www/bookmeatoz.online_ts/frontend/src/pages/dashboard/business/BusinessSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { BusinessProfile, UpdateBusinessSettingsDto, PERMISSIONS, ApiErrorResponse } from '@/types';
import { useCurrentBusinessProfile, useUpdateBusinessSettings } from '@/hooks/business.hooks'; // New hooks
import Spinner from '@/components/common/Spinner';
import toast from '@/utils/toast';

// Define IANA timezones (partial list for example, use a library for full list in production)
const timezones = [
  "UTC", "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Asia/Tokyo", "Australia/Sydney"
  // Add more or use a library to generate this list
];
const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]; // Example currencies

const generalInfoSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  phone: z.string().optional().nullable().refine(val => !val || /^[+]?[0-9\s-()]{7,20}$/.test(val), "Invalid phone number"),
  timezone: z.string().min(1, "Timezone is required"), // Add .refine(val => timezones.includes(val)) if using a fixed list
  currency: z.string().length(3, "Currency code must be 3 letters"),
});

type GeneralInfoFormValues = z.infer<typeof generalInfoSchema>;

interface Tab {
  name: string;
  id: 'general' | 'hours' | 'servicesConfig' | 'bookingPolicy' | 'customization';
}

const tabs: Tab[] = [
  { name: 'General Information', id: 'general' },
  { name: 'Business Hours', id: 'hours' },
  // { name: 'Service Settings', id: 'servicesConfig' }, // e.g. default buffer times
  { name: 'Booking Policies', id: 'bookingPolicy' },
  // { name: 'Online Booking Page', id: 'customization' },
];

const BusinessSettingsPage: React.FC = () => {
  const { businessInfo: tenantContextBusinessInfo } = useTenant(); // This might be lean
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab['id']>('general');

  // Fetch the full business profile using TanStack Query
  const { data: businessProfile, isLoading: isLoadingProfile, error: profileError } = useCurrentBusinessProfile();
  const updateSettingsMutation = useUpdateBusinessSettings();

  const { register, handleSubmit, formState: { errors, isDirty,isSubmitting: isFormSubmitting }, reset, control } = useForm<GeneralInfoFormValues>({
    resolver: zodResolver(generalInfoSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (businessProfile) {
      reset({
        name: businessProfile.name || '',
        slug: businessProfile.slug || '',
        description: businessProfile.settings?.description || '',
        phone: businessProfile.settings?.phone || '',
        timezone: businessProfile.timezone || 'UTC',
        currency: businessProfile.currency || 'USD',
      });
    }
  }, [businessProfile, reset]);

  const onGeneralInfoSubmit: SubmitHandler<GeneralInfoFormValues> = async (data) => {
    if (!businessProfile) return;
    // The DTO expects fields that are top-level on Business and others inside settings
    const payload: UpdateBusinessSettingsDto = {
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
        currency: data.currency,
        // These go into the 'settings' JSONB field on the backend business model
        description: data.description, 
        phone: data.phone,
        // Any other settings from the form would be added here
    };
    try {
        await updateSettingsMutation.mutateAsync(payload);
        // Success toast is handled by the hook's onSuccess
    } catch (e) {
        // Error toast is handled by the hook's onError
        console.error("Update failed from page:", e);
    }
  };
  
  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_BUSINESS_SETTINGS);

  if (isLoadingProfile && !businessProfile) return <div className="p-6 flex justify-center items-center min-h-[300px]"><Spinner size="h-10 w-10" /> <span className="ml-3">Loading business settings...</span></div>;
  
  if (profileError) return <div className="p-6 text-red-500 bg-red-50 rounded-md">Error loading settings: {(profileError as ApiErrorResponse).message}</div>;

  if (!tenantContextBusinessInfo && !businessProfile) return <div className="p-6 text-red-500">No active business context found. Please select or create a business.</div>;
  
  if (!canManageSettings) return <div className="p-6 text-orange-500">You do not have permission to manage these settings.</div>;
  
  const currentBusinessName = businessProfile?.name || tenantContextBusinessInfo?.name || 'Business';


  return (
    <div className="p-4 md:p-6 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        Business Settings for <span className="text-primary-dark">{currentBusinessName}</span>
      </h1>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary text-primary-dark'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 shadow-xl rounded-lg">
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit(onGeneralInfoSubmit)} className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">General Information</h2>
            <p className="text-sm text-gray-500 mb-6">Update your business's core details, timezone, and currency.</p>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Business Name</label>
              <input type="text" id="name" {...register("name")} disabled={updateSettingsMutation.isPending}
                className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Business Slug (URL)</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  {currentSubdomain || `your-tenant`}.bookmeatoz.online/
                </span>
                <input type="text" id="slug" {...register("slug")} disabled={updateSettingsMutation.isPending}
                  className={`flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md focus:ring-primary focus:border-primary sm:text-sm ${errors.slug ? 'border-red-500' : 'border-gray-300'}`} 
                  placeholder="your-business-name"
                />
              </div>
               {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
               <p className="mt-1 text-xs text-gray-500">Used in your public booking page URL. Lowercase letters, numbers, and hyphens only.</p>
            </div>
             <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Business Description (Optional)</label>
              <textarea id="description" {...register("description")} rows={3} disabled={updateSettingsMutation.isPending}
                className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.description ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Business Phone (Optional)</label>
              <input type="tel" id="phone" {...register("phone")} disabled={updateSettingsMutation.isPending}
                className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select id="timezone" {...register("timezone")} disabled={updateSettingsMutation.isPending}
                        className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.timezone ? 'border-red-500' : 'border-gray-300'}`}>
                        {timezones.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                    </select>
                    {errors.timezone && <p className="mt-1 text-xs text-red-600">{errors.timezone.message}</p>}
                </div>
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
                    <select id="currency" {...register("currency")} disabled={updateSettingsMutation.isPending}
                        className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${errors.currency ? 'border-red-500' : 'border-gray-300'}`}>
                        {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                    </select>
                    {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>}
                </div>
            </div>
            <div className="pt-5">
              <button type="submit" disabled={!isDirty || updateSettingsMutation.isPending || isFormSubmitting}
                className="btn btn-primary py-2.5 px-6 disabled:opacity-70 flex items-center">
                {(updateSettingsMutation.isPending || isFormSubmitting) && <Spinner size="h-5 w-5 mr-2" color="text-white"/>}
                Save General Information
              </button>
            </div>
          </form>
        )}

        {activeTab === 'hours' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Default Business Hours</h2>
            <p className="text-sm text-gray-500 mb-6">Set the standard operating hours for your entire business. Employee-specific schedules can override these if needed.</p>
            {/* TODO: Implement a WeeklyScheduleEditor for business-wide hours.
                This would fetch/save working_hours where employee_id is NULL and business_id is current.
                Need new TanStack Query hooks: useBusinessWorkingHours, useUpdateBusinessWorkingHours.
            */}
            <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-400">
              <p className="font-medium">Business-wide Weekly Schedule Editor</p>
              <p className="text-xs mt-1">To be implemented. This will allow setting default opening hours for each day of the week.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'bookingPolicy' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Policies</h2>
            <p className="text-sm text-gray-500 mb-6">Configure rules for online bookings, cancellations, and scheduling limits.</p>
            {/* TODO: Implement forms for:
                - Cancellation policy (e.g., notice period in hours/days)
                - Minimum booking lead time (e.g., cannot book less than 2 hours in advance)
                - Maximum booking window (e.g., can book up to 60 days in advance)
                - Other policies as needed (e.g., require payment upfront - conceptual)
                These would map to fields in business.settings JSONB.
            */}
             <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-400">
              <p className="font-medium">Booking Policy Configuration</p>
              <p className="text-xs mt-1">Forms for cancellation policy, lead times, etc. - To be implemented.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSettingsPage;
