import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { Service } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const serviceService = {
  async createService(
    businessId: string,
    tenantId: string, // For logging and ensuring context, though businessId is primary key for service
    serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'business_id'>
  ): Promise<Service> {
    const {
      name,
      description,
      duration,
      price,
      currency,
      status = 'active',
      settings,
      category_id,
      is_private,
    } = serviceData;

    if (!name || duration == null || price == null || !currency) {
      throw new AppError('Name, duration, price, and currency are required for a service.', 400);
    }
    if (duration <= 0) {
      throw new AppError('Duration must be a positive number.', 400);
    }
    if (price < 0) {
      throw new AppError('Price cannot be negative.', 400);
    }

    const serviceId = uuidv4();
    const insertQuery = `
      INSERT INTO services (id, business_id, name, description, duration, price, currency, status, settings, category_id, is_private, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `;
    try {
      const result = await dbQuery(insertQuery, [
        serviceId,
        businessId,
        name,
        description,
        duration,
        price,
        currency,
        status,
        settings ? JSON.stringify(settings) : '{}',
        category_id,
        is_private === undefined ? false : is_private,
      ]);
      logger.info(
        `Service created for business ${businessId} (tenant ${tenantId}): ${result.rows[0].name}`
      );
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating service:', { businessId, name, error: error.message });
      if (error.code === '23505') {
        // Unique constraint violation (e.g. name per business)
        throw new AppError(
          `A service with the name "${name}" already exists for this business.`,
          409
        );
      }
      throw new AppError('Failed to create service.', 500);
    }
  },

  async getServiceById(businessId: string, serviceId: string): Promise<Service | null> {
    const selectQuery = 'SELECT * FROM services WHERE id = $1 AND business_id = $2;';
    try {
      const result = await dbQuery(selectQuery, [serviceId, businessId]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error fetching service by ID:', {
        serviceId,
        businessId,
        error: error.message,
      });
      throw new AppError('Failed to retrieve service.', 500);
    }
  },

  async getServicesByBusiness(
    businessId: string,
    filters: { status?: Service['status']; categoryId?: string; isPrivate?: boolean } = {}
  ): Promise<Service[]> {
    let selectQuery = 'SELECT * FROM services WHERE business_id = $1';
    const queryParams: any[] = [businessId];
    let paramIndex = 2;

    if (filters.status) {
      selectQuery += ` AND status = $${paramIndex++}`;
      queryParams.push(filters.status);
    }
    if (filters.categoryId) {
      selectQuery += ` AND category_id = $${paramIndex++}`;
      queryParams.push(filters.categoryId);
    }
    if (filters.isPrivate !== undefined) {
      selectQuery += ` AND is_private = $${paramIndex++}`;
      queryParams.push(filters.isPrivate);
    }
    selectQuery += ' ORDER BY name ASC;'; // Default ordering

    try {
      const result = await dbQuery(selectQuery, queryParams);
      return result.rows;
    } catch (error: any) {
      logger.error('Error fetching services for business:', { businessId, error: error.message });
      throw new AppError('Failed to retrieve services.', 500);
    }
  },

  async updateService(
    businessId: string,
    serviceId: string,
    updateData: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at' | 'business_id'>>
  ): Promise<Service | null> {
    const allowedUpdates: Array<keyof typeof updateData> = [
      'name',
      'description',
      'duration',
      'price',
      'currency',
      'status',
      'settings',
      'category_id',
      'is_private',
    ];
    const updates = [];
    const values = [];
    let paramIndex = 1; // For $1, $2, etc. in SET clause

    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        if (key === 'settings' && typeof updateData[key] === 'object') {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          updates.push(`${key} = $${paramIndex++}`);
          values.push(updateData[key]);
        }
      }
    }

    if (updates.length === 0) {
      throw new AppError('No valid fields provided for update.', 400);
    }

    // Add business_id and service_id for WHERE clause
    values.push(businessId, serviceId);

    const updateQuery = `
      UPDATE services
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE business_id = $${paramIndex++} AND id = $${paramIndex++}
      RETURNING *;
    `;

    try {
      const result = await dbQuery(updateQuery, values);
      if (result.rows.length === 0) {
        return null; // Or throw AppError if service must exist
      }
      logger.info(`Service updated: ${result.rows[0].id} for business ${businessId}`);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error updating service:', { serviceId, businessId, error: error.message });
      if (error.code === '23505') {
        // Unique constraint violation (e.g. name per business)
        throw new AppError(
          `A service with the name "${updateData.name}" already exists for this business.`,
          409
        );
      }
      throw new AppError('Failed to update service.', 500);
    }
  },

  async deleteService(businessId: string, serviceId: string): Promise<boolean> {
    // Consider soft delete (setting status to 'archived' or 'deleted') vs. hard delete
    // Also, check for dependencies (e.g., existing bookings for this service)
    // For now, a hard delete:
    const deleteQuery = 'DELETE FROM services WHERE id = $1 AND business_id = $2;';
    try {
      // First, check if service has any non-cancelled/non-completed bookings
      const bookingCheckQuery = `
        SELECT COUNT(*) as count 
        FROM bookings 
        WHERE service_id = $1 AND status NOT IN ('cancelled', 'completed', 'rejected');
      `;
      const bookingCheckResult = await dbQuery(bookingCheckQuery, [serviceId]);
      if (parseInt(bookingCheckResult.rows[0].count, 10) > 0) {
        throw new AppError(
          'Cannot delete service with active or upcoming bookings. Please archive it instead or reassign bookings.',
          409
        );
      }

      const result = await dbQuery(deleteQuery, [serviceId, businessId]);
      if (result.rowCount === 0) {
        logger.warn(
          `Attempted to delete non-existent service or service not belonging to business: ${serviceId}, business ${businessId}`
        );
        return false; // Or throw 404
      }
      logger.info(`Service deleted: ${serviceId} from business ${businessId}`);
      return true;
    } catch (error: any) {
      logger.error('Error deleting service:', { serviceId, businessId, error: error.message });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete service.', 500);
    }
  },
};
