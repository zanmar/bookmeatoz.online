# Feature: Timezone-Aware Public Booking Flow

This document outlines the architecture and implementation of the timezone-aware public booking flow for tenants. The primary goal is to ensure that users select time slots displayed in the business's local timezone, and all date/time information is handled consistently across the frontend and backend.

## 1. Core Type Definitions & Validation (`frontend/src/types/`)

New TypeScript types and Zod schemas were introduced to standardize data structures for services, employees, availability, and bookings.

-   **`service.types.ts`**: Defines `Service` interface.
-   **`employee.types.ts`**: Defines `EmployeeProfile` for basic employee info.
-   **`availability.types.ts`**: Defines `TimeSlot` (with UTC start/end times) and `AvailabilityQuery` (for fetching slots, expects date in business's local timezone).
-   **`booking.types.ts`**:
    -   `CustomerDetailsSchema`: Zod schema for customer name, email, phone, notes.
    -   `PublicBookingFormSchema`: Zod schema for the entire public booking form, including service ID, optional employee ID, selected date (as JS `Date`), selected time slot (as UTC ISO string), and nested customer details.
    -   `PublicBookingFormData`: TypeScript type inferred from `PublicBookingFormSchema`.
    -   `CreateBookingPayload`: Interface for the data sent to the backend when creating a booking (uses UTC start time).
-   **`index.ts`**: Updated to export these new types and consolidate permission definitions. The `PERMISSIONS` object was updated to include new booking-related permissions (`MANAGE_ALL_BOOKINGS`, `VIEW_SERVICES`, `VIEW_EMPLOYEES`, `VIEW_SCHEDULES`, `CREATE_BOOKING`), while retaining existing permissions.

## 2. API Data Hooks (`frontend/src/hooks/`)

Custom TanStack Query hooks were created to encapsulate API interactions for fetching booking-related data:

-   **`services.hooks.ts` (`useServices`)**: Fetches a list of services for the current business. (Assumed to be pre-existing or created separately, but used by the booking page).
-   **`employee.hooks.ts` (`useFetchEmployees`, `useEmployee`)**:
    -   `useFetchEmployees`: Fetches employees, optionally filtered by `serviceId`. Used in the booking page employee selector.
    -   `useEmployee`: Fetches details for a single employee (not directly used in this public flow but related).
-   **`availability.hooks.ts` (`useFetchAvailableTimeSlots`)**:
    -   Takes `service_id`, `date` (YYYY-MM-DD string in business's local timezone), and optional `employee_id` as parameters.
    -   Crucially, it also accepts the `businessTimezone` string to pass to the API, ensuring the backend interprets the `date` parameter correctly.
    -   Returns available `TimeSlot[]`, where `start_time` and `end_time` are UTC ISO strings.
-   **`booking.hooks.ts` (`useCreateBooking`)**:
    -   Provides a `mutate` function for creating a new booking.
    -   Takes a `CreateBookingPayload` (which includes the UTC `start_time`).
    -   Handles API success/error states and shows toast notifications.
-   **`queryKeys.ts`**: Updated to include query keys for `employees` and `availability`, ensuring proper caching and invalidation strategies.

## 3. UI Component Enhancements (`frontend/src/components/booking/`)

Existing booking UI components were refactored to use the new hooks and improve timezone handling:

-   **`ServiceSelector.tsx`**:
    -   Internally uses `useServices` to fetch and display available services.
    -   Props simplified to `onSelectService` and `selectedServiceId`.
-   **`EmployeeSelector.tsx`**:
    -   Internally uses `useFetchEmployees`, re-fetching when the `serviceId` prop changes.
    -   Props updated to include `serviceId`.
-   **`DatePickerEnhanced.tsx`**:
    -   No major code changes, but verified to correctly emit a JS `Date` object (representing the user's local midnight for the selected day) via its `onSelectDate` prop.
    -   The parent component (`TenantPublicBookingPage`) is responsible for formatting this `Date` object into a 'YYYY-MM-DD' string in the business's timezone before sending it to the API.
-   **`TimeSlotPicker.tsx`**:
    -   Takes `slots` (UTC ISO strings) and `isLoadingSlots` as props.
    -   Internally uses the `useTimezone` hook to get `businessTimezone` and `formatInBusinessTimezone` function.
    -   **Displays all time slots in the business's local timezone**, ensuring clarity for the user regardless of their own timezone.
    -   Shows appropriate loading and "no slots available" messages.
-   **`CustomerDetailsForm.tsx`**:
    -   Refactored to be a controlled component within the main booking form (`TenantPublicBookingPage`).
    *   No longer manages its own state with `useForm`.
    *   Accepts `control` and `errors` props from the parent `react-hook-form` instance.
    *   Input fields are registered to the parent form's state under the `customerDetails` path (e.g., `customerDetails.name`).
    *   Uses the shared `CustomerDetailsSchema` (imported from `booking.types.ts`) via the parent form's resolver.

## 4. Booking Page Orchestration (`frontend/src/pages/tenant/TenantPublicBookingPage.tsx`)

The main booking page was significantly refactored to use `react-hook-form` for managing the entire booking form state and TanStack Query for data fetching.

-   **Form Management**:
    -   `useForm<PublicBookingFormData>` is initialized with `PublicBookingFormSchema` for validation.
    -   Form fields (`serviceId`, `employeeId`, `selectedDate`, `selectedTimeSlot`, and nested `customerDetails`) are registered and managed by `react-hook-form`.
    -   Child components (`ServiceSelector`, `EmployeeSelector`, `DatePickerEnhanced`, `TimeSlotPicker`, `CustomerDetailsForm`) are integrated as controlled components using `<Controller>` or by passing `control` and `errors`.
-   **Data Fetching & Dependencies**:
    -   `useServices` fetches services.
    -   `useFetchEmployees` fetches employees based on `watch("serviceId")`.
    -   `watchedSelectedDate` (JS `Date` object) is formatted into a 'YYYY-MM-DD' string **in the business's timezone** using `formatInBusinessTimezone` from `useTimezone`. This formatted date string is then used as a parameter for `useFetchAvailableTimeSlots`.
    -   `useFetchAvailableTimeSlots` fetches slots using the formatted date and `watchedServiceId`, `watchedEmployeeId`.
-   **Submission Logic**:
    -   The main form's `onSubmit` handler:
        1.  Performs a final slot availability check using a dedicated API endpoint (`/bookings/public/:businessId/slot-check`) with the UTC `start_time` from the selected slot.
        2.  If the slot is still available, constructs the `CreatePublicBookingDto` payload. The `start_time` is the UTC ISO string from the selected time slot.
        3.  Calls the `mutate` function from the `useCreateBooking` hook.
        4.  Handles `onSuccess` (displays confirmation, resets form) and `onError` (displays error message) from the mutation.
-   **Timezone Handling Summary for Page**:
    -   **User Date Selection**: `DatePickerEnhanced` provides a JS `Date` object (user's local).
    -   **API Date Formatting**: This `Date` object is converted to a 'YYYY-MM-DD' string **in the business's timezone** before being used in the `useFetchAvailableTimeSlots` hook.
    -   **Slot Display**: `TimeSlotPicker` displays slots in the business's local timezone.
    -   **Slot Submission**: The `selectedTimeSlot` (which is a UTC ISO string for the slot's start) is taken directly from the form data and sent to the backend.
    -   **Confirmation Display**: Booking date and time are displayed in the business's local timezone using `formatInBusinessTimezone` and `TimeDisplay` component configured with `businessTimezone`.

## 5. Unit Tests

Unit tests were created for the new/modified hooks and UI components to ensure reliability:
-   `employee.hooks.test.ts`
-   `availability.hooks.test.ts`
-   `ServiceSelector.test.tsx`
-   `EmployeeSelector.test.tsx`
-   `DatePickerEnhanced.test.tsx` (including mock for `react-datepicker`)
-   `TimeSlotPicker.test.tsx`
-   `CustomerDetailsForm.test.tsx` (using a `TestWrapper` to simulate parent form context)
-   `TenantPublicBookingPage.test.tsx` (comprehensive integration test for the entire flow)

## Conclusion

This refactoring establishes a robust, timezone-aware public booking flow. By centralizing form state with `react-hook-form`, managing API interactions with TanStack Query hooks, and ensuring consistent timezone handling through the `useTimezone` hook and careful data formatting, the system provides a more reliable and user-friendly booking experience. Components are now more focused and testable.
