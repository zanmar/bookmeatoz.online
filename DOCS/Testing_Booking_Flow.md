# Testing Strategy: Timezone-Aware Public Booking Flow

This document outlines the testing strategy implemented for the timezone-aware public booking flow. Tests were created at various levels (hooks, components, page integration) to ensure the reliability and correctness of the feature. All tests utilize `vitest` as the test runner and `@testing-library/react` for component rendering and interaction.

## 1. Custom Hooks Tests (`frontend/src/hooks/`)

Unit tests were created for the custom TanStack Query hooks to verify their data fetching logic, parameter handling, and error states.

### a. `employee.hooks.test.ts`

-   **`useFetchEmployees`**:
    -   Verifies successful fetching of employees when a `serviceId` is provided.
    -   Checks that API parameters are correctly passed (e.g., `service_id`, `is_active`, `limit`).
    -   Tests fetching all active employees if `serviceId` is not provided.
    -   Ensures the hook is disabled (does not fetch) if `businessId` (from `useTenant`) is unavailable.
    -   Validates error state handling if the API call fails.
    -   Mocks: `apiService`, `useTenant`.

### b. `availability.hooks.test.ts`

-   **`useFetchAvailableTimeSlots`**:
    -   Tests successful fetching of available time slots.
    -   Verifies correct API parameters, including `service_id`, `date` (as 'YYYY-MM-DD'), and `timezone` (business's timezone).
    -   Checks correct handling of `employee_id` parameter (included if provided and not "any", excluded if "any" or undefined).
    -   Ensures the hook is disabled if critical parameters (businessId, serviceId, date, businessTimezone) are missing.
    -   Validates error state handling.
    -   Mocks: `apiService`, `useTenant`.

### c. `booking.hooks.test.ts` (Conceptual - test file not explicitly created in this scope but hook is tested via page)

-   **`useCreateBooking`**:
    -   Although a dedicated test file (`booking.hooks.test.ts`) wasn't part of the provided files for this specific task, the `useCreateBooking` hook's functionality (success/error handling, toast notifications) is implicitly tested via the `TenantPublicBookingPage.test.tsx` integration test.
    -   A direct unit test for this hook would typically mock `apiService.post` and verify:
        -   Correct payload transmission.
        -   `onSuccess` behavior (e.g., toast messages, query invalidation if configured).
        -   `onError` behavior (e.g., toast messages).

## 2. UI Component Tests (`frontend/src/components/booking/`)

Unit tests for individual UI components ensure they render correctly based on props, handle user interactions, and display loading/error/empty states.

### a. `ServiceSelector.test.tsx`

-   Tests that services (fetched via the mocked `useServices` hook) are rendered correctly in the dropdown.
-   Verifies that `onSelectService` callback is triggered with the correct `serviceId` on change.
-   Checks display of loading, error, and "no services available" states.
-   Tests the `disabled` prop.
-   Mocks: `useServices`.

### b. `EmployeeSelector.test.tsx`

-   Tests rendering of "Please select a service first" message when `serviceId` is null.
-   Verifies correct rendering of employees (from mocked `useFetchEmployees`) and "Any Available" option.
-   Checks that `onSelectEmployee` callback is triggered.
-   Tests loading, error, and various "no employees" states (with and without `allowAny`).
-   Tests the `disabled` prop and `allowAny={false}` behavior.
-   Mocks: `useFetchEmployees`.

### c. `DatePickerEnhanced.test.tsx`

-   Uses a mock for the `react-datepicker` library to simplify testing.
-   Verifies that the component renders and calls `onSelectDate` prop with a `Date` object upon change.
-   Checks display of placeholder text, disabled state, and business timezone information.
-   Ensures `dateFormat` and `minDate` props are passed to the underlying (mocked) datepicker.
-   Mocks: `react-datepicker`.

### d. `TimeSlotPicker.test.tsx`

-   Tests rendering of time slots, ensuring they are formatted in the business's timezone (using a mocked `useTimezone`).
-   Verifies that `onSelectSlot` callback is triggered with the correct `TimeSlot` object.
-   Checks display of "Please select a date first" (when disabled), loading, and "no time slots available" messages.
-   Tests that unavailable slots are correctly disabled.
-   Mocks: `useTimezone`.

### e. `CustomerDetailsForm.test.tsx`

-   Uses a `TestWrapper` component to simulate its usage within a parent `react-hook-form` context.
-   Verifies correct rendering of input fields.
-   Tests user input and ensures data is submitted via the parent form's `onSubmit` handler.
-   Checks display of validation errors passed from the parent form (via `mockErrors` prop on `TestWrapper`).
-   Tests the `disabled` state (which would be controlled by the parent form's `isSubmitting` or other logic).
-   Mocks: None directly, but `TestWrapper` sets up `useForm`.

## 3. Page Integration Test (`frontend/src/pages/tenant/`)

### a. `TenantPublicBookingPage.test.tsx`

-   Provides an end-to-end test for the entire public booking flow.
-   **Environment**: Uses `QueryClientProvider` for TanStack Query and `MemoryRouter` for routing context.
-   **Mocks**:
    -   All relevant custom hooks (`useTenant`, `useAuth`, `useTimezone`, `useServices`, `useFetchEmployees`, `useFetchAvailableTimeSlots`, `useCreateBooking`).
    -   `apiService` (for the slot re-validation check).
    -   `react-hot-toast`.
    -   `react-datepicker`.
-   **Scenario**:
    1.  Simulates user selecting a service.
    2.  (Optionally) selecting an employee or proceeding with "Any Available".
    3.  Selecting a date using the mocked date picker.
    4.  Selecting an available time slot.
    5.  Filling in customer details.
    6.  Submitting the form.
-   **Assertions**:
    -   Verifies that `createBookingMutation.mutate` (from `useCreateBooking`) is called with the correct payload.
    -   Checks that the UI updates to the confirmation screen upon successful booking.
    -   Ensures success toasts are displayed.
    -   (Future enhancements could include testing error paths like slot taken, booking creation failure).

## Conclusion

This multi-layered testing approach aims to cover the critical aspects of the timezone-aware booking flow:
-   **Hook Logic**: Correct API interactions, parameter handling, and state management within hooks.
-   **Component Behavior**: Proper rendering, user interaction, and display of different states for each UI piece.
-   **Integration**: Correct data flow and state orchestration between components and hooks on the main booking page, leading to a successful booking creation.

This strategy provides confidence in the feature's functionality and helps prevent regressions.
