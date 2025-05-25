import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import apiService from '@/services/apiService'; // To be created
import { TenantInfo, BusinessInfo, ApiErrorResponse } from '@/types';

interface TenantContextType {
  currentSubdomain: string | null;
  tenantInfo: TenantInfo | null; // Info about the tenant (e.g., from tenants table)
  businessInfo: BusinessInfo | null; // Info about the specific business at this subdomain
  isLoadingTenant: boolean;
  errorTenant: string | null;
  // refreshTenantInfo: () => Promise<void>; // Optional: to manually refresh
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const getSubdomain = (hostname: string): string | null => {
  const parts = hostname.split('.');
  // Assuming bookmeatoz.online (2 parts) or www.bookmeatoz.online (3 parts) is main
  // Subdomain would be mybiz.bookmeatoz.online (3 parts)
  // This logic needs to be robust for your domain structure (e.g. localhost, custom domains later)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // For local development, you might use a query param or a fixed subdomain for testing
    // const queryParams = new URLSearchParams(window.location.search);
    // return queryParams.get('subdomain_dev') || null; // e.g., http://localhost:5173/?subdomain_dev=mybiz
    return null; // Or a default dev subdomain if needed
  }

  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api') {
    // Check if the last two parts are your main domain
    // This is a simple check, for production you might want a more robust TLD check or config
    const mainDomainCandidate = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (mainDomainCandidate.toLowerCase() === 'bookmeatoz.online') { // Ensure this matches your actual main domain
        return parts[0];
    }
  }
  return null;
};

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);
  const [errorTenant, setErrorTenant] = useState<string | null>(null);

  const fetchTenantAndBusinessInfo = useCallback(async (subdomain: string) => {
    setIsLoadingTenant(true);
    setErrorTenant(null);
    setTenantInfo(null);
    setBusinessInfo(null);

    try {
      // API endpoint to fetch business (and implicitly tenant) info by subdomain
      // The backend tenantMiddleware resolves tenantId and businessId from subdomain.
      // This frontend call might hit an endpoint like GET /api/v1/public/business-by-subdomain/:subdomain
      // Or the backend could use the Host header if API calls are made to the subdomain directly.
      // For simplicity, let's assume an endpoint that takes subdomain.
      // The backend should be configured to handle this, potentially without auth for public tenant pages.
      
      // Option 1: API call to the main domain, passing subdomain
      // const response = await apiService.get(`/public/resolve-subdomain/${subdomain}`);
      
      // Option 2: If API calls are made to the subdomain itself (e.g. mybiz.bookmeatoz.online/api/...)
      // then the backend's tenantMiddleware should handle context.
      // We'd need a generic endpoint on the subdomain to get its own business/tenant details.
      // e.g. GET /api/v1/business/context (on the subdomain)
      const response = await apiService.get<{ business: BusinessInfo, tenant: TenantInfo }>(
        `/public/business-profile-by-subdomain/${subdomain}` // Example endpoint
      );

      if (response.data) {
        setBusinessInfo(response.data.business);
        setTenantInfo(response.data.tenant); // Assuming backend returns both
        // Potentially set a tenant-specific theme or configuration here
        if (response.data.business?.settings?.themeColor) {
            // document.documentElement.style.setProperty('--color-primary', response.data.business.settings.themeColor);
        }

      } else {
        // This case should ideally be handled by API returning 404 if success is false
        setErrorTenant('Business information not found for this subdomain.');
        console.warn(`No business/tenant info returned for subdomain: ${subdomain}`);
      }
    } catch (err: any) {
      console.error(`Error fetching tenant/business info for subdomain ${subdomain}:`, err);
      const apiError = err as ApiErrorResponse;
      if (apiError.statusCode === 404) {
        setErrorTenant(`No business found for '${subdomain}'. This space may be available!`);
      } else {
        setErrorTenant(apiError.message || 'Failed to load business information.');
      }
      setTenantInfo(null);
      setBusinessInfo(null);
    } finally {
      setIsLoadingTenant(false);
    }
  }, []);

  useEffect(() => {
    const detectedSubdomain = getSubdomain(window.location.hostname);
    setCurrentSubdomain(detectedSubdomain);

    if (detectedSubdomain) {
      fetchTenantAndBusinessInfo(detectedSubdomain);
    } else {
      // No subdomain, or on main site
      setTenantInfo(null);
      setBusinessInfo(null);
      setIsLoadingTenant(false);
      setErrorTenant(null);
    }
  }, [fetchTenantAndBusinessInfo]);


  return (
    <TenantContext.Provider value={{
      currentSubdomain,
      tenantInfo,
      businessInfo,
      isLoadingTenant,
      errorTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
