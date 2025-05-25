import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiService from '@/services/apiService'; // To be created
import { AuthenticatedUser, UserRole, Permission, ApiErrorResponse } from '@/types'; // Assuming these types are in src/types

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  token: string | null;
  isLoadingAuth: boolean;
  login: (accessToken: string, userData: AuthenticatedUser) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permissions: Permission | Permission[]) => boolean;
  // setUser: React.Dispatch<React.SetStateAction<AuthenticatedUser | null>>; // If manual update needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); // Start true until initial check

  const storeToken = (accessToken: string) => {
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    apiService.setAuthToken(accessToken); // Configure apiService with the token
  };

  const clearToken = () => {
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user'); // Also clear stored user data
    apiService.setAuthToken(null);
  };

  const login = useCallback(async (accessToken: string, userData: AuthenticatedUser) => {
    storeToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData)); // Store user data
    // Potentially redirect or perform other actions after login
  }, []);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      if (token) {
        await apiService.post('/auth/logout', {}); // Inform backend to blacklist token
      }
    } catch (error) {
      console.error('Logout API call failed, proceeding with client-side logout:', error);
    } finally {
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      // Redirect to login page, usually handled by ProtectedRoute or router logic
      // window.location.href = '/login'; // Or use useNavigate
    }
  }, [token]);

  const initializeAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      apiService.setAuthToken(storedToken); // Important: Set token for apiService early

      if (storedUser) {
        try {
          const parsedUser: AuthenticatedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
           // Optionally, verify token with a lightweight backend endpoint like /auth/me
          try {
            const response = await apiService.get<AuthenticatedUser>('/auth/me');
            if (response.data) { // Assuming ApiSuccessResponse structure
                setUser(response.data); // Update with fresh user data
                localStorage.setItem('user', JSON.stringify(response.data));
            } else {
                // Token might be valid but user data fetch failed or structure mismatch
                console.warn('Auth/me fetch did not return expected data, using stored user.');
            }
          } catch (error) {
            console.error('Token verification failed on init, logging out:', error);
            await logout(); // Token is invalid or expired
          }

        } catch (e) {
          console.error("Failed to parse stored user, clearing auth state.", e);
          await logout();
        }
      } else {
         // No stored user, but token exists. Try to fetch user.
        try {
            const response = await apiService.get<AuthenticatedUser>('/auth/me');
            if (response.data) {
                setUser(response.data);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(response.data));
            } else {
                await logout(); // No user data from /me
            }
        } catch (error) {
            console.error('Token exists but /auth/me failed, logging out:', error);
            await logout();
        }
      }
    } else {
      // No token found
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
  }, [logout]);


  const hasRole = useCallback((rolesToCheck: UserRole | UserRole[]) => {
    if (!user || !user.roles) return false;
    const rolesArray = Array.isArray(rolesToCheck) ? rolesToCheck : [rolesToCheck];
    return user.roles.some(userRole => rolesArray.includes(userRole));
  }, [user]);

  const hasPermission = useCallback((permissionsToCheck: Permission | Permission[]) => {
    if (!user || !user.permissions) return false;
    const permissionsArray = Array.isArray(permissionsToCheck) ? permissionsToCheck : [permissionsToCheck];
    // Ensure user.permissions is an array
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
    return permissionsArray.every(permission => userPermissions.includes(permission));
  }, [user]);


  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      token,
      isLoadingAuth,
      login,
      logout,
      initializeAuth,
      hasRole,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
