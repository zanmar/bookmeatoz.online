/* eslint-disable camelcase */

// Helper function to create common entity columns
const createCommonEntityColumns = (pgm) => ({
  id: { type: 'UUID', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
  created_at: {
    type: 'TIMESTAMPTZ',
    notNull: true,
    default: pgm.func('CURRENT_TIMESTAMP'),
  },
  updated_at: {
    type: 'TIMESTAMPTZ',
    notNull: true,
    default: pgm.func('CURRENT_TIMESTAMP'),
  },
});

// Helper function to create settings column
const createSettingsColumn = () => ({
  settings: { type: 'JSONB', default: '{}' },
});

// Helper function to create updated_at trigger
const createUpdatedAtTrigger = (pgm, tableName) => {
  pgm.sql(`
    CREATE TRIGGER trigger_set_timestamp_${tableName}
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.up = async (pgm) => {
  // Enable required extensions
  pgm.createExtension('uuid-ossp', { ifNotExists: true });
  pgm.createExtension('plpgsql', { ifNotExists: true });

  // Create the trigger function for updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create RLS context functions
  pgm.sql(`
    CREATE OR REPLACE FUNCTION current_session_tenant_id()
    RETURNS UUID AS $$
    BEGIN
      RETURN current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION current_session_business_id()
    RETURNS UUID AS $$
    BEGIN
      RETURN current_setting('app.current_business_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION current_session_user_id()
    RETURNS UUID AS $$
    BEGIN
      RETURN current_setting('app.current_user_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION is_system_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN COALESCE(current_setting('app.is_system_admin', true)::BOOLEAN, false);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN false;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create ENUM types
  pgm.createType('tenant_status_type_v1', ['active', 'inactive', 'suspended']);
  pgm.createType('business_status_type_v1', ['active', 'inactive', 'suspended', 'pending_setup']);
  pgm.createType('service_status_type_v1', ['active', 'inactive', 'archived']);
  pgm.createType('booking_status_type_v1', ['pending', 'confirmed', 'cancelled', 'completed', 'rejected', 'no_show']);
  pgm.createType('user_status_type_v1', ['active', 'inactive', 'suspended', 'pending_verification', 'invited']);
  pgm.createType('customer_status_type_v1', ['active', 'inactive', 'blacklisted']);
  pgm.createType('subscription_status_type_v1', ['active', 'inactive', 'past_due', 'cancelled', 'trialing']);
  pgm.createType('employee_status_type_v1', ['active', 'inactive', 'terminated', 'pending_onboarding']);
  pgm.createType('user_business_role_status_type_v1', ['active', 'pending', 'revoked']);

  // Create tables

  // 1. Tenants table
  pgm.createTable('tenants', {
    ...createCommonEntityColumns(pgm),
    name: { type: 'VARCHAR(255)', notNull: true },
    subdomain: { type: 'VARCHAR(100)', notNull: true, unique: true },
    status: { type: 'tenant_status_type_v1', notNull: true, default: 'active' },
    ...createSettingsColumn(),
  });

  pgm.createIndex('tenants', 'subdomain');
  pgm.createIndex('tenants', 'status');
  createUpdatedAtTrigger(pgm, 'tenants');

  // 2. Users table
  pgm.createTable('users', {
    ...createCommonEntityColumns(pgm),
    email: { type: 'VARCHAR(255)', notNull: true, unique: true },
    password_hash: { type: 'VARCHAR(255)', notNull: true },
    status: { type: 'user_status_type_v1', notNull: true, default: 'pending_verification' },
    profile: { type: 'JSONB', default: '{}' },
    email_verified: { type: 'BOOLEAN', notNull: true, default: false },
    last_login_at: { type: 'TIMESTAMPTZ' },
    system_role: { type: 'VARCHAR(50)', default: "'user'" },
  });

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'status');
  pgm.createIndex('users', 'system_role');
  createUpdatedAtTrigger(pgm, 'users');

  // 3. Subscription plans table
  pgm.createTable('subscription_plans', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    name: { type: 'VARCHAR(255)', notNull: true },
    description: { type: 'TEXT' },
    price: { type: 'DECIMAL(10,2)', notNull: true },
    currency: { type: 'VARCHAR(3)', notNull: true, default: 'USD' },
    billing_interval: { type: 'VARCHAR(20)', notNull: true },
    features: { type: 'JSONB', default: '{}' },
    max_businesses: { type: 'INTEGER' },
    max_employees_per_business: { type: 'INTEGER' },
    max_services_per_business: { type: 'INTEGER' },
    max_bookings_per_month: { type: 'INTEGER' },
    custom_branding_enabled: { type: 'BOOLEAN', default: false },
    api_access_enabled: { type: 'BOOLEAN', default: false },
    priority_support: { type: 'BOOLEAN', default: false },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  createUpdatedAtTrigger(pgm, 'subscription_plans');

  // 4. Tenant subscriptions table
  pgm.createTable('tenant_subscriptions', {
    ...createCommonEntityColumns(pgm),
    tenant_id: { type: 'UUID', notNull: true, unique: true, references: 'tenants(id)', onDelete: 'CASCADE' },
    plan_id: { type: 'VARCHAR(50)', notNull: true, references: 'subscription_plans(id)' },
    status: { type: 'subscription_status_type_v1', notNull: true, default: 'trialing' },
    trial_start_date: { type: 'TIMESTAMPTZ' },
    trial_end_date: { type: 'TIMESTAMPTZ' },
    billing_start_date: { type: 'TIMESTAMPTZ' },
    next_billing_date: { type: 'TIMESTAMPTZ' },
    last_billing_date: { type: 'TIMESTAMPTZ' },
    cancelled_at: { type: 'TIMESTAMPTZ' },
    cancellation_reason: { type: 'TEXT' },
  });

  pgm.createIndex('tenant_subscriptions', 'tenant_id');
  pgm.createIndex('tenant_subscriptions', 'plan_id');
  pgm.createIndex('tenant_subscriptions', 'status');
  createUpdatedAtTrigger(pgm, 'tenant_subscriptions');

  // 5. Businesses table
  pgm.createTable('businesses', {
    ...createCommonEntityColumns(pgm),
    tenant_id: { type: 'UUID', notNull: true, references: 'tenants(id)', onDelete: 'CASCADE' },
    name: { type: 'VARCHAR(255)', notNull: true },
    slug: { type: 'VARCHAR(100)', notNull: true, unique: true },
    status: { type: 'business_status_type_v1', notNull: true, default: 'pending_setup' },
    timezone: { type: 'VARCHAR(50)', notNull: true, default: 'UTC' },
    subdomain: { type: 'VARCHAR(100)', unique: true },
    currency: { type: 'VARCHAR(3)', notNull: true, default: 'USD' },
    ...createSettingsColumn(),
  });

  pgm.createIndex('businesses', 'tenant_id');
  pgm.createIndex('businesses', 'slug');
  pgm.createIndex('businesses', 'subdomain');
  pgm.createIndex('businesses', 'status');
  createUpdatedAtTrigger(pgm, 'businesses');

  // 6. Employees table
  pgm.createTable('employees', {
    ...createCommonEntityColumns(pgm),
    user_id: { type: 'UUID', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    employment_status: { type: 'employee_status_type_v1', notNull: true, default: 'pending_onboarding' },
    ...createSettingsColumn(),
  });

  pgm.createIndex('employees', 'user_id');
  pgm.createIndex('employees', 'business_id');
  pgm.createIndex('employees', 'employment_status');
  pgm.addConstraint('employees', 'unique_user_business', 'UNIQUE(user_id, business_id)');
  createUpdatedAtTrigger(pgm, 'employees');

  // 7. User business roles table
  pgm.createTable('user_business_roles', {
    ...createCommonEntityColumns(pgm),
    user_id: { type: 'UUID', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    role: { type: 'VARCHAR(50)', notNull: true },
    status: { type: 'user_business_role_status_type_v1', notNull: true, default: 'pending' },
  });

  pgm.createIndex('user_business_roles', 'user_id');
  pgm.createIndex('user_business_roles', 'business_id');
  pgm.createIndex('user_business_roles', 'role');
  pgm.addConstraint('user_business_roles', 'unique_user_business_role', 'UNIQUE(user_id, business_id, role)');
  createUpdatedAtTrigger(pgm, 'user_business_roles');

  // 8. Service categories table
  pgm.createTable('service_categories', {
    ...createCommonEntityColumns(pgm),
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    name: { type: 'VARCHAR(255)', notNull: true },
    description: { type: 'TEXT' },
    sort_order: { type: 'INTEGER', default: 0 },
  });

  pgm.createIndex('service_categories', 'business_id');
  pgm.addConstraint('service_categories', 'unique_business_category_name', 'UNIQUE(business_id, name)');
  createUpdatedAtTrigger(pgm, 'service_categories');

  // 9. Services table
  pgm.createTable('services', {
    ...createCommonEntityColumns(pgm),
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    name: { type: 'VARCHAR(255)', notNull: true },
    description: { type: 'TEXT' },
    duration: { type: 'INTEGER', notNull: true },
    price: { type: 'DECIMAL(10,2)', notNull: true },
    currency: { type: 'VARCHAR(3)', notNull: true, default: 'USD' },
    status: { type: 'service_status_type_v1', notNull: true, default: 'active' },
    category_id: { type: 'UUID', references: 'service_categories(id)', onDelete: 'SET NULL' },
    is_private: { type: 'BOOLEAN', notNull: true, default: false },
    buffer_before_minutes: { type: 'INTEGER', default: 0 },
    buffer_after_minutes: { type: 'INTEGER', default: 0 },
    ...createSettingsColumn(),
  });

  pgm.createIndex('services', 'business_id');
  pgm.createIndex('services', 'category_id');
  pgm.createIndex('services', 'status');
  pgm.addConstraint('services', 'unique_business_service_name', 'UNIQUE(business_id, name)');
  createUpdatedAtTrigger(pgm, 'services');

  // 10. Employee services table
  pgm.createTable('employee_services', {
    ...createCommonEntityColumns(pgm),
    employee_id: { type: 'UUID', notNull: true, references: 'employees(id)', onDelete: 'CASCADE' },
    service_id: { type: 'UUID', notNull: true, references: 'services(id)', onDelete: 'CASCADE' },
  });

  pgm.createIndex('employee_services', 'employee_id');
  pgm.createIndex('employee_services', 'service_id');
  pgm.addConstraint('employee_services', 'unique_employee_service', 'UNIQUE(employee_id, service_id)');
  createUpdatedAtTrigger(pgm, 'employee_services');

  // 11. Working hours table
  pgm.createTable('working_hours', {
    ...createCommonEntityColumns(pgm),
    employee_id: { type: 'UUID', references: 'employees(id)', onDelete: 'CASCADE' },
    business_id: { type: 'UUID', references: 'businesses(id)', onDelete: 'CASCADE' },
    day_of_week: { type: 'SMALLINT', notNull: true },
    start_time: { type: 'TIME', notNull: true },
    end_time: { type: 'TIME', notNull: true },
    is_off: { type: 'BOOLEAN', notNull: true, default: false },
  });

  pgm.createIndex('working_hours', 'employee_id');
  pgm.createIndex('working_hours', 'business_id');
  pgm.createIndex('working_hours', 'day_of_week');
  createUpdatedAtTrigger(pgm, 'working_hours');

  // 12. Employee availability overrides table
  pgm.createTable('employee_availability_overrides', {
    ...createCommonEntityColumns(pgm),
    employee_id: { type: 'UUID', notNull: true, references: 'employees(id)', onDelete: 'CASCADE' },
    start_time: { type: 'TIMESTAMPTZ', notNull: true },
    end_time: { type: 'TIMESTAMPTZ', notNull: true },
    is_unavailable: { type: 'BOOLEAN', notNull: true, default: true },
    reason: { type: 'TEXT' },
  });

  pgm.createIndex('employee_availability_overrides', 'employee_id');
  pgm.createIndex('employee_availability_overrides', 'start_time');
  pgm.createIndex('employee_availability_overrides', 'end_time');
  createUpdatedAtTrigger(pgm, 'employee_availability_overrides');

  // 13. Customers table
  pgm.createTable('customers', {
    ...createCommonEntityColumns(pgm),
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    user_id: { type: 'UUID', references: 'users(id)', onDelete: 'SET NULL' },
    email: { type: 'VARCHAR(255)', notNull: true },
    name: { type: 'VARCHAR(255)', notNull: true },
    phone: { type: 'VARCHAR(50)' },
    profile_notes: { type: 'TEXT' },
    status: { type: 'customer_status_type_v1', notNull: true, default: 'active' },
  });

  pgm.createIndex('customers', 'business_id');
  pgm.createIndex('customers', 'user_id');
  pgm.createIndex('customers', 'email');
  pgm.createIndex('customers', 'status');
  pgm.addConstraint('customers', 'unique_business_customer_email', 'UNIQUE(business_id, email)');
  createUpdatedAtTrigger(pgm, 'customers');

  // 14. Bookings table
  pgm.createTable('bookings', {
    ...createCommonEntityColumns(pgm),
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    customer_id: { type: 'UUID', notNull: true, references: 'customers(id)', onDelete: 'CASCADE' },
    service_id: { type: 'UUID', notNull: true, references: 'services(id)', onDelete: 'RESTRICT' },
    employee_id: { type: 'UUID', references: 'employees(id)', onDelete: 'SET NULL' },
    start_time: { type: 'TIMESTAMPTZ', notNull: true },
    end_time: { type: 'TIMESTAMPTZ', notNull: true },
    status: { type: 'booking_status_type_v1', notNull: true, default: 'pending' },
    notes: { type: 'TEXT' },
    metadata: { type: 'JSONB', default: '{}' },
    booked_by_user_id: { type: 'UUID', references: 'users(id)', onDelete: 'SET NULL' },
    cancellation_reason: { type: 'TEXT' },
    rescheduled_from_booking_id: { type: 'UUID', references: 'bookings(id)', onDelete: 'SET NULL' },
    reminder_sent_24h: { type: 'BOOLEAN', notNull: true, default: false },
    reminder_sent_1h: { type: 'BOOLEAN', notNull: true, default: false },
  });

  pgm.createIndex('bookings', 'business_id');
  pgm.createIndex('bookings', 'customer_id');
  pgm.createIndex('bookings', 'service_id');
  pgm.createIndex('bookings', 'employee_id');
  pgm.createIndex('bookings', 'start_time');
  pgm.createIndex('bookings', 'end_time');
  pgm.createIndex('bookings', 'status');
  pgm.createIndex('bookings', ['start_time', 'end_time']);
  createUpdatedAtTrigger(pgm, 'bookings');

  // Auth support tables

  // 15. Token blacklist table
  pgm.createTable('token_blacklist', {
    id: { type: 'UUID', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    token_jti: { type: 'VARCHAR(255)', notNull: true, unique: true },
    user_id: { type: 'UUID', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    blacklisted_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    expires_at: { type: 'TIMESTAMPTZ', notNull: true },
  });

  pgm.createIndex('token_blacklist', 'token_jti');
  pgm.createIndex('token_blacklist', 'user_id');
  pgm.createIndex('token_blacklist', 'expires_at');

  // 16. Password resets table
  pgm.createTable('password_resets', {
    id: { type: 'UUID', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    user_id: { type: 'UUID', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    token: { type: 'VARCHAR(255)', notNull: true, unique: true },
    expires_at: { type: 'TIMESTAMPTZ', notNull: true },
    used_at: { type: 'TIMESTAMPTZ' },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('password_resets', 'user_id');
  pgm.createIndex('password_resets', 'token');
  pgm.createIndex('password_resets', 'expires_at');

  // 17. Email verifications table
  pgm.createTable('email_verifications', {
    id: { type: 'UUID', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    user_id: { type: 'UUID', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    token: { type: 'VARCHAR(255)', notNull: true, unique: true },
    expires_at: { type: 'TIMESTAMPTZ', notNull: true },
    verified_at: { type: 'TIMESTAMPTZ' },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('email_verifications', 'user_id');
  pgm.createIndex('email_verifications', 'token');
  pgm.createIndex('email_verifications', 'expires_at');
};

exports.down = async (pgm) => {
  // Drop tables in reverse order due to foreign key constraints
  pgm.dropTable('email_verifications');
  pgm.dropTable('password_resets');
  pgm.dropTable('token_blacklist');
  pgm.dropTable('bookings');
  pgm.dropTable('customers');
  pgm.dropTable('employee_availability_overrides');
  pgm.dropTable('working_hours');
  pgm.dropTable('employee_services');
  pgm.dropTable('services');
  pgm.dropTable('service_categories');
  pgm.dropTable('user_business_roles');
  pgm.dropTable('employees');
  pgm.dropTable('businesses');
  pgm.dropTable('tenant_subscriptions');
  pgm.dropTable('subscription_plans');
  pgm.dropTable('users');
  pgm.dropTable('tenants');

  // Drop ENUM types
  pgm.dropType('user_business_role_status_type_v1');
  pgm.dropType('employee_status_type_v1');
  pgm.dropType('subscription_status_type_v1');
  pgm.dropType('customer_status_type_v1');
  pgm.dropType('user_status_type_v1');
  pgm.dropType('booking_status_type_v1');
  pgm.dropType('service_status_type_v1');
  pgm.dropType('business_status_type_v1');
  pgm.dropType('tenant_status_type_v1');

  // Drop functions
  pgm.sql('DROP FUNCTION IF EXISTS is_system_admin();');
  pgm.sql('DROP FUNCTION IF EXISTS current_session_user_id();');
  pgm.sql('DROP FUNCTION IF EXISTS current_session_business_id();');
  pgm.sql('DROP FUNCTION IF EXISTS current_session_tenant_id();');
  pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp();');
};
