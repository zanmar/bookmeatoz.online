// Basic employee structure for selection in booking flow
export interface EmployeeProfile {
  id: string; // This is the employees.id (employment profile ID)
  user_id: string; // users.id
  business_id: string;
  name: string; // User's full name
  email: string; // User's email
  profile_picture_url?: string;
}
