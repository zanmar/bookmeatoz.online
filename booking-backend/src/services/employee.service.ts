import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { User, UserRole, EmployeeDetails, EmployeeInvitation, PERMISSIONS, Status } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { authService } from './auth.service'; // For user creation

export const employeeService = {
  async inviteOrAddEmployee(
    businessId: string,
    inviterUserId: string,
    email: string,
    role: UserRole,
    name?: string
  ): Promise<{
    employee: EmployeeDetails | null;
    invitation: EmployeeInvitation | null;
    message: string;
  }> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const userResult = await client.query('SELECT * FROM users WHERE email = $1', [
        email.toLowerCase(),
      ]);
      let user: User | null = userResult.rows.length > 0 ? userResult.rows[0] : null;
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        if (!name) throw new AppError('Name is required when inviting a new user.', 400);
        // Simplified user creation; authService.register might be more complete
        const tempPassword = uuidv4().slice(0, 12); // more secure temp password
        user = await authService.register({
          email: email.toLowerCase(),
          password: tempPassword,
          name: name,
        }); // This creates a user
        logger.info(`New user ${user.email} created via employee invitation.`);
        // TODO: Send setup/invitation email to new user with temp password or setup link
      }

      // Check if an 'employees' record exists for this user_id and business_id, or create one.
      // The 'employees' table in the migration had user_id as unique, which is problematic if a user can be an employee at multiple businesses.
      // Let's assume 'employees' table's PK is 'id', and it has 'user_id' and 'business_id'.
      // If your 'employees' table is meant to be a global profile for a user who is an employee somewhere:
      const employeeRecordResult = await client.query(
        'SELECT id FROM employees WHERE user_id = $1 AND business_id = $2',
        [user.id, businessId]
      );
      let employeeRecordId: string;

      if (employeeRecordResult.rows.length === 0) {
        employeeRecordId = uuidv4();
        await client.query(
          'INSERT INTO employees (id, user_id, business_id, employment_status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
          [employeeRecordId, user.id, businessId, 'active']
        );
        logger.info(
          `Created employees record ${employeeRecordId} for user ${user.id} in business ${businessId}`
        );
      } else {
        employeeRecordId = employeeRecordResult.rows[0].id;
      }

      // Now manage role in user_business_roles using users.id
      const existingEmployeeRole = await client.query(
        'SELECT role FROM user_business_roles WHERE user_id = $1 AND business_id = $2',
        [user.id, businessId]
      );

      if (existingEmployeeRole.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new AppError(
          `User ${email} is already an employee of this business with role: ${existingEmployeeRole.rows[0].role}. To change role, use update.`,
          409
        );
      }

      const roleAssignmentId = uuidv4();
      await client.query(
        'INSERT INTO user_business_roles (id, user_id, business_id, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [roleAssignmentId, user.id, businessId, role, 'active'] // Assuming 'active' status for the role
      );

      const message = `User ${email} has been added as an employee with role '${role}'.`;
      // Invitation record logic can remain similar if needed for tracking new user invites.

      await client.query('COMMIT');
      logger.info(
        `Employee role ${role} assigned for user ${email} in business ${businessId}. Employee record ID: ${employeeRecordId}`
      );

      const finalEmployeeDetails = await this.getEmployeeDetails(businessId, employeeRecordId); // Fetch by employees.id

      return { employee: finalEmployeeDetails, invitation: null, message };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error inviting or adding employee:', { businessId, email, role, error });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to invite or add employee.', 500);
    } finally {
      client.release();
    }
  },

  async getEmployeesByBusiness(businessId: string): Promise<EmployeeDetails[]> {
    const selectQuery = `
      SELECT
        e.id AS id, -- This is employees.id
        e.user_id,
        e.business_id,
        e.employment_status,
        u.email,
        u.profile->>'name' as name,
        u.status as user_status,
        ubr.role,
        e.created_at, 
        e.updated_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN user_business_roles ubr ON u.id = ubr.user_id AND e.business_id = ubr.business_id
      WHERE e.business_id = $1
      ORDER BY u.profile->>'name' ASC;
    `;
    try {
      const result = await dbQuery(selectQuery, [businessId]);
      // Only map fields that exist in EmployeeDetails
      // Remove name, profile_picture_url, employment_status from mapping
      return result.rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        business_id: row.business_id,
        role: row.role,
        status: row.status, // This is the Employee.status field
        user_email: row.email,
        user_name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error: any) {
      logger.error('Error fetching employees for business:', { businessId, error: error.message });
      throw new AppError('Failed to retrieve employees.', 500);
    }
  },

  // Fetches by employees.id
  async getEmployeeDetails(
    businessId: string,
    employeeId: string
  ): Promise<EmployeeDetails | null> {
    const selectQuery = `
      SELECT
        e.id AS id, -- employees.id
        e.user_id,
        e.business_id,
        e.employment_status,
        u.email,
        u.profile->>'name' as name,
        u.status as user_status,
        ubr.role,
        e.created_at,
        e.updated_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN user_business_roles ubr ON u.id = ubr.user_id AND e.business_id = ubr.business_id
      WHERE e.business_id = $1 AND e.id = $2;
    `;
    try {
      const result = await dbQuery(selectQuery, [businessId, employeeId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id, // employees.id
        user_id: row.user_id,
        business_id: row.business_id,
        role: row.role as UserRole,
        status: row.status, // This is the Employee.status field
        user_email: row.email,
        user_name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error: any) {
      logger.error('Error fetching employee details:', {
        businessId,
        employeeId,
        error: error.message,
      });
      throw new AppError('Failed to retrieve employee details.', 500);
    }
  },

  // employeeUserId here is users.id, employeeIdToUpdate is employees.id
  async updateEmployeeRole(
    businessId: string,
    employeeUserIdToUpdateRoleFor: string,
    newRole: UserRole
  ): Promise<EmployeeDetails | null> {
    // Find the employees.id record based on employeeUserIdToUpdateRoleFor (users.id) and businessId
    const empRecordRes = await dbQuery(
      'SELECT id FROM employees WHERE user_id = $1 AND business_id = $2',
      [employeeUserIdToUpdateRoleFor, businessId]
    );
    if (empRecordRes.rows.length === 0) {
      throw new AppError('Employee profile not found for this user in this business.', 404);
    }
    const employeeRecordId = empRecordRes.rows[0].id; // This is employees.id

    // Update role in user_business_roles using users.id
    const updateQuery = `
      UPDATE user_business_roles
      SET role = $1, updated_at = NOW()
      WHERE user_id = $2 AND business_id = $3
      RETURNING role;
    `;
    try {
      const result = await dbQuery(updateQuery, [
        newRole,
        employeeUserIdToUpdateRoleFor,
        businessId,
      ]);
      if (result.rows.length === 0) {
        throw new AppError('Employee role assignment not found or no update occurred.', 404);
      }
      logger.info(
        `Employee role updated for user ${employeeUserIdToUpdateRoleFor} in business ${businessId} to ${newRole}`
      );
      return this.getEmployeeDetails(businessId, employeeRecordId); // Fetch by employees.id
    } catch (error: any) {
      logger.error('Error updating employee role:', {
        employeeUserIdToUpdateRoleFor,
        businessId,
        newRole,
        error: error.message,
      });
      throw new AppError('Failed to update employee role.', 500);
    }
  },

  // employeeUserIdToRemove is users.id
  async removeEmployeeFromBusiness(
    businessId: string,
    employeeUserIdToRemove: string
  ): Promise<boolean> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // 1. Delete from user_business_roles
      const roleDeleteResult = await client.query(
        'DELETE FROM user_business_roles WHERE user_id = $1 AND business_id = $2;',
        [employeeUserIdToRemove, businessId]
      );

      // 2. Delete from employees table (specific to this business)
      const employeeRecordDeleteResult = await client.query(
        'DELETE FROM employees WHERE user_id = $1 AND business_id = $2;',
        [employeeUserIdToRemove, businessId]
      );

      if (roleDeleteResult.rowCount === 0 && employeeRecordDeleteResult.rowCount === 0) {
        logger.warn(
          `Attempted to remove non-existent employee: user ${employeeUserIdToRemove} from business ${businessId}`
        );
        await client.query('ROLLBACK');
        return false;
      }

      // TODO: What about their schedules, overrides, assigned services? Cascade delete or reassign?
      // For now, assuming FK constraints with ON DELETE CASCADE handle some of this (e.g., working_hours if employee_id is FK to employees.id)

      await client.query('COMMIT');
      logger.info(
        `Employee (user ${employeeUserIdToRemove}) removed from business ${businessId} (roles and employee record).`
      );
      return true;
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error removing employee from business:', {
        employeeUserIdToRemove,
        businessId,
        error: error.message,
      });
      throw new AppError('Failed to remove employee.', 500);
    } finally {
      client.release();
    }
  },
};
