import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { Customer, CreateCustomerDto, UpdateCustomerDto, PERMISSIONS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const customerService = {
  async createCustomer(businessId: string, customerData: CreateCustomerDto): Promise<Customer> {
    const {
      email,
      name,
      phone,
      profile_notes,
      status = 'active',
      settings,
      user_id,
    } = customerData;

    if (!email || !name) {
      throw new AppError('Email and name are required to create a customer.', 400);
    }

    // Optional: Check if a user with this email already exists on the platform
    // If so, you might want to link this customer record to that user_id if not provided.
    // For now, we'll create a distinct customer record. If user_id is provided, we assume it's valid.

    const customerId = uuidv4();
    const insertQuery = `
      INSERT INTO customers (id, business_id, user_id, email, name, phone, profile_notes, status, settings, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;
    try {
      const result = await dbQuery(insertQuery, [
        customerId,
        businessId,
        user_id, // Can be null
        email.toLowerCase(), // Store emails consistently
        name,
        phone,
        profile_notes,
        status,
        settings ? JSON.stringify(settings) : '{}',
      ]);
      logger.info(`Customer created for business ${businessId}: ${result.rows[0].email}`);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating customer:', {
        businessId,
        email,
        error: error.message,
        code: error.code,
      });
      if (error.code === '23505') {
        // unique_violation (e.g., if (business_id, email) is unique)
        throw new AppError(
          `A customer with email "${email}" already exists for this business.`,
          409
        );
      }
      if (error.code === '23503' && error.constraint === 'customers_user_id_fkey') {
        // foreign key violation for user_id
        throw new AppError(
          'Invalid user ID provided. The specified platform user does not exist.',
          400
        );
      }
      throw new AppError('Failed to create customer.', 500);
    }
  },

  async getCustomerById(businessId: string, customerId: string): Promise<Customer | null> {
    const selectQuery = 'SELECT * FROM customers WHERE id = $1 AND business_id = $2;';
    try {
      const result = await dbQuery(selectQuery, [customerId, businessId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error: any) {
      logger.error('Error fetching customer by ID:', {
        customerId,
        businessId,
        error: error.message,
      });
      throw new AppError('Failed to retrieve customer.', 500);
    }
  },

  async getCustomersByBusiness(
    businessId: string,
    filters: { status?: Customer['status']; searchTerm?: string },
    pagination: { page: number; limit: number }
  ): Promise<{ customers: Customer[]; total: number }> {
    let selectQuery = 'SELECT * FROM customers WHERE business_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM customers WHERE business_id = $1';
    const queryParams: any[] = [businessId];
    let paramIndex = 2;

    if (filters.status) {
      const statusFilter = ` AND status = $${paramIndex++}`;
      selectQuery += statusFilter;
      countQuery += statusFilter;
      queryParams.push(filters.status);
    }
    if (filters.searchTerm) {
      const searchTermFilter = ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      selectQuery += searchTermFilter;
      countQuery += searchTermFilter;
      queryParams.push(`%${filters.searchTerm}%`); // Add wildcard for ILIKE
      paramIndex++;
    }

    selectQuery += ` ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
    const offset = (pagination.page - 1) * pagination.limit;
    queryParams.push(pagination.limit, offset);

    try {
      const customersResult = await dbQuery(selectQuery, queryParams);
      // For countQuery, remove limit and offset params
      const countParams = queryParams.slice(0, paramIndex - 3); // -3 because limit, offset, and the $index for limit were added
      const totalResult = await dbQuery(countQuery, countParams);

      return {
        customers: customersResult.rows,
        total: parseInt(totalResult.rows[0].count, 10),
      };
    } catch (error: any) {
      logger.error('Error fetching customers for business:', {
        businessId,
        filters,
        error: error.message,
      });
      throw new AppError('Failed to retrieve customers.', 500);
    }
  },

  async updateCustomer(
    businessId: string,
    customerId: string,
    updateData: UpdateCustomerDto
  ): Promise<Customer | null> {
    const allowedUpdates: Array<keyof UpdateCustomerDto> = [
      'email',
      'name',
      'phone',
      'profile_notes',
      'status',
      'settings',
    ];
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        if (key === 'settings' && typeof updateData[key] === 'object') {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(JSON.stringify(updateData[key]));
        } else if (key === 'email') {
          updates.push(`${key} = $${paramIndex++}`);
          values.push((updateData[key] as string).toLowerCase());
        } else {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(updateData[key]);
        }
      }
    }

    if (updates.length === 0) {
      throw new AppError('No valid fields provided for customer update.', 400);
    }

    values.push(businessId, customerId); // For WHERE clause

    const updateQuery = `
      UPDATE customers
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE business_id = $${paramIndex++} AND id = $${paramIndex++}
      RETURNING *;
    `;

    try {
      const result = await dbQuery(updateQuery, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`Customer updated: ${result.rows[0].id} for business ${businessId}`);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error updating customer:', {
        customerId,
        businessId,
        error: error.message,
        code: error.code,
      });
      if (error.code === '23505') {
        // unique_violation
        throw new AppError(
          `A customer with the provided email already exists for this business.`,
          409
        );
      }
      throw new AppError('Failed to update customer.', 500);
    }
  },

  async deleteCustomer(businessId: string, customerId: string): Promise<boolean> {
    // Consider soft delete (setting status to 'inactive' or 'archived')
    // Check for dependencies like active bookings before hard deleting.
    // For now, a hard delete:
    const deleteQuery = 'DELETE FROM customers WHERE id = $1 AND business_id = $2;';
    try {
      // Add dependency checks here, e.g., bookings
      const bookingCheckQuery = `SELECT COUNT(*) as count FROM bookings WHERE customer_id = $1 AND business_id = $2 AND status NOT IN ('completed', 'cancelled', 'rejected')`;
      const bookingResult = await dbQuery(bookingCheckQuery, [customerId, businessId]);
      if (parseInt(bookingResult.rows[0].count, 10) > 0) {
        throw new AppError(
          'Cannot delete customer with active or upcoming bookings. Please resolve bookings first or mark customer as inactive.',
          409
        );
      }

      const result = await dbQuery(deleteQuery, [customerId, businessId]);
      if (result.rowCount === 0) {
        logger.warn(
          `Attempted to delete non-existent customer or customer not belonging to business: ${customerId}, business ${businessId}`
        );
        return false;
      }
      logger.info(`Customer deleted: ${customerId} from business ${businessId}`);
      return true;
    } catch (error: any) {
      logger.error('Error deleting customer:', { customerId, businessId, error: error.message });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete customer.', 500);
    }
  },
};
