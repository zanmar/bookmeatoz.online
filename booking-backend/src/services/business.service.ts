import { query as dbQuery, getClient } from '@/config/db';
import { AppError } from '@/utils/errorHandler';
import logger from '@/utils/logger';
import { Business, CreateBusinessDto, UpdateBusinessDto } from '@/types'; // Assuming these types exist
import { v4 as uuidv4 } from 'uuid';

export const businessService = {
  async createBusiness(tenantId: string, businessData: CreateBusinessDto): Promise<Business> {
    const {
      name,
      slug,
      timezone = 'UTC',
      currency = 'USD',
      settings,
      subdomain,
      status = 'pending_setup',
    } = businessData;

    if (!name || !slug) {
      throw new AppError('Business name and slug are required.', 400);
    }
    // Removed timezone validation as isValidTimezone is not available

    const businessId = uuidv4();
    const insertQuery = `
      INSERT INTO businesses (id, tenant_id, name, slug, timezone, currency, settings, subdomain, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;
    try {
      const result = await dbQuery(insertQuery, [
        businessId,
        tenantId,
        name,
        slug,
        timezone,
        currency,
        settings ? JSON.stringify(settings) : '{}',
        subdomain,
        status,
      ]);
      logger.info(
        `Business created: ${result.rows[0].name} (ID: ${businessId}) for tenant ${tenantId}`
      );
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating business:', {
        tenantId,
        name,
        error: error.message,
        code: error.code,
      });
      if (error.code === '23505') {
        // unique_violation for slug or subdomain
        if (error.constraint && error.constraint.includes('slug')) {
          throw new AppError(`A business with the slug "${slug}" already exists.`, 409);
        }
        if (error.constraint && error.constraint.includes('subdomain')) {
          throw new AppError(`The subdomain "${subdomain}" is already taken.`, 409);
        }
      }
      throw new AppError('Failed to create business.', 500);
    }
  },

  async updateBusiness(
    businessId: string,
    tenantId: string,
    updateData: UpdateBusinessDto
  ): Promise<Business | null> {
    const allowedUpdates: Array<keyof UpdateBusinessDto> = [
      'name',
      'slug',
      'timezone',
      'currency',
      'settings',
      'subdomain',
      'status',
    ];
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Removed timezone validation as isValidTimezone is not available

    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        // Special handling for JSONB if needed, or if type is already correct
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
      throw new AppError('No valid fields provided for business update.', 400);
    }

    values.push(businessId, tenantId); // For WHERE clause

    const updateQuery = `
      UPDATE businesses
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++} 
      RETURNING *; 
    `;
    // Ensure tenant_id check for security, so one tenant cannot update another's business by guessing ID.

    try {
      const result = await dbQuery(updateQuery, values);
      if (result.rows.length === 0) {
        // Could be due to businessId not found OR businessId not belonging to tenantId
        logger.warn(
          `Business update failed or not found: businessId=${businessId}, tenantId=${tenantId}`
        );
        return null;
      }
      logger.info(`Business updated: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error updating business:', {
        businessId,
        error: error.message,
        code: error.code,
      });
      if (error.code === '23505') {
        /* Handle unique constraint violations */
      }
      throw new AppError('Failed to update business.', 500);
    }
  },
  // ... other business service methods (getBusinessById, etc.)
  async getBusinessById(businessId: string, tenantId?: string): Promise<Business | null> {
    let queryText = 'SELECT * FROM businesses WHERE id = $1';
    const queryParams: any[] = [businessId];
    if (tenantId) {
      queryText += ' AND tenant_id = $2';
      queryParams.push(tenantId);
    }
    const result = await dbQuery(queryText, queryParams);
    return result.rows.length > 0 ? result.rows[0] : null;
  },
};
