import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CustomerDetailsForm from './CustomerDetailsForm';
import { PublicBookingFormData, PublicBookingFormSchema } from '@/types'; // Main form data type and schema
import { vi } from 'vitest';

// TestWrapper simulates how CustomerDetailsForm is used within a larger form context
const TestWrapper: React.FC<{ 
  defaultValues?: Partial<PublicBookingFormData['customerDetails']>;
  onSubmit: (data: PublicBookingFormData['customerDetails']) => void;
  mockControl?: Control<PublicBookingFormData>; 
  mockErrors?: FieldErrors<PublicBookingFormData>; // Errors for the whole form
  disabled?: boolean;
  // isSubmittingBooking prop is removed from CustomerDetailsForm, parent passes 'disabled'
}> = ({ 
  defaultValues, 
  onSubmit, 
  mockControl, 
  mockErrors,
  disabled = false,
}) => {
  const { control, handleSubmit, formState: { errors } } = useForm<PublicBookingFormData>({
    resolver: zodResolver(PublicBookingFormSchema), // Use the actual main form schema
    defaultValues: {
      serviceId: 'service-id-default', 
      selectedDate: new Date(),       
      selectedTimeSlot: 'slot-default',
      customerDetails: defaultValues || { name: '', email: '', phone: '', notes: '' },
    },
  });

  // Pass the customerDetails part of errors or the mock for customerDetails errors
  const customerErrors = mockErrors?.customerDetails || errors.customerDetails;

  return (
    <form onSubmit={handleSubmit(data => onSubmit(data.customerDetails))}>
      <CustomerDetailsForm 
        control={mockControl || control} 
        errors={customerErrors as FieldErrors<PublicBookingFormData['customerDetails']> | undefined} 
        disabled={disabled} // Pass the disabled state directly
      />
      <button type="submit" data-testid="form-submit-button">Submit</button>
    </form>
  );
};

describe('CustomerDetailsForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockOnSubmit.mockClear();
  });

  it('renders input fields correctly', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    // Assuming CustomerDetailsForm.tsx uses these exact labels (as per previous task)
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument(); // Or "Email Address" if that's what's in the component
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument(); // Or "Phone Number"
    expect(screen.getByLabelText(/Notes for your booking/i)).toBeInTheDocument(); // Or "Additional Notes"
  });

  it('allows typing and submits data via parent form', async () => {
    render(
      <TestWrapper 
        onSubmit={mockOnSubmit} 
        defaultValues={{ name: 'Old Name', email: 'old@example.com' }}
      />
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/Notes for your booking/i), { target: { value: 'New notes' } });
    
    fireEvent.click(screen.getByTestId('form-submit-button'));

    await vi.waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        phone: '9876543210',
        notes: 'New notes',
      });
    });
  });

  it('displays validation errors passed from parent form', async () => {
    const mockParentErrors: FieldErrors<PublicBookingFormData> = { // Mock errors for the whole form structure
      customerDetails: {
        name: { type: 'manual', message: 'Parent says name is required.' },
        email: { type: 'manual', message: 'Parent says email is bad.' },
      }
    };
    render(<TestWrapper onSubmit={mockOnSubmit} mockErrors={mockParentErrors} />);
    
    expect(await screen.findByText('Parent says name is required.')).toBeInTheDocument();
    expect(await screen.findByText('Parent says email is bad.')).toBeInTheDocument();
    
    // Since the TestWrapper uses the full PublicBookingFormSchema, and we are passing errors
    // that should make the form invalid, clicking submit should ideally not call mockOnSubmit.
    fireEvent.click(screen.getByTestId('form-submit-button'));
    // This assertion depends on the resolver correctly preventing submission
    // if the `customerDetails` part of the form is invalid.
    // If the schema is complex or has interdependencies not mocked here, this might need adjustment.
    // For now, we assume zodResolver works as expected with the provided errors.
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  it('disables fields when disabled prop is true', () => {
    render(<TestWrapper onSubmit={mockOnSubmit} disabled={true} />);
    expect(screen.getByLabelText(/Full Name/i)).toBeDisabled();
    expect(screen.getByLabelText(/Email/i)).toBeDisabled();
    expect(screen.getByLabelText(/Phone/i)).toBeDisabled();
    expect(screen.getByLabelText(/Notes for your booking/i)).toBeDisabled();
  });

  // The `isSubmittingBooking` prop was removed from CustomerDetailsForm directly,
  // it's handled by the parent passing the `disabled` prop.
  // So, the test for `isSubmittingBooking` is covered by the `disabled={true}` test.
  // If you want to specifically test the TestWrapper's logic of combining them,
  // you could do that, but CustomerDetailsForm itself only knows about `disabled`.
});
