import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ServiceSelector from './ServiceSelector';
import { useServices } from '@/hooks/services.hooks';
import { Service, PaginatedResponse } from '@/types';

vi.mock('@/hooks/services.hooks');

const mockServices: Service[] = [
  { id: 's1', name: 'Service 1', duration_minutes: 60, price: 100, currency: 'USD', business_id: 'b1', is_active: true, created_at: '', updated_at: '' },
  { id: 's2', name: 'Service 2', duration_minutes: 90, price: 150, currency: 'USD', business_id: 'b1', is_active: true, created_at: '', updated_at: '' },
];

const mockServicesResponse: PaginatedResponse<Service> = {
  data: mockServices,
  total: mockServices.length,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe('ServiceSelector', () => {
  let mockOnSelectService: (serviceId: string) => void;

  beforeEach(() => {
    mockOnSelectService = vi.fn();
    (useServices as vi.Mock).mockReturnValue({ 
      data: { data: mockServicesResponse }, 
      isLoading: false, 
      isError: false, 
      error: null 
    });
  });

  it('renders services correctly and calls onSelectService on change', () => {
    render(
      <ServiceSelector 
        onSelectService={mockOnSelectService} 
        selectedServiceId="s1" 
      />
    );

    expect(screen.getByText('1. Select a Service:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Service 1 (60 min) - USD 100.00')).toBeInTheDocument();
    
    mockServices.forEach(service => {
      expect(screen.getByText(`${service.name} (${service.duration_minutes} min) - ${service.currency} ${service.price.toFixed(2)}`)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's2' } });
    expect(mockOnSelectService).toHaveBeenCalledWith('s2');
  });

  it('shows loading state', () => {
    (useServices as vi.Mock).mockReturnValue({ data: null, isLoading: true, isError: false, error: null });
    render(<ServiceSelector onSelectService={mockOnSelectService} />);
    expect(screen.getByText('Loading services...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useServices as vi.Mock).mockReturnValue({ 
      data: null, 
      isLoading: false, 
      isError: true, 
      error: { message: 'Failed to load' } 
    });
    render(<ServiceSelector onSelectService={mockOnSelectService} />);
    expect(screen.getByText('Error loading services: Failed to load')).toBeInTheDocument();
  });

  it('shows "no services available" message when services array is empty', () => {
    (useServices as vi.Mock).mockReturnValue({ 
        data: { data: { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }}, 
        isLoading: false, 
        isError: false, 
        error: null 
    });
    render(<ServiceSelector onSelectService={mockOnSelectService} />);
    expect(screen.getByText('No services available for booking at the moment.')).toBeInTheDocument();
  });

  it('disables the selector when disabled prop is true', () => {
    render(<ServiceSelector onSelectService={mockOnSelectService} disabled={true} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
