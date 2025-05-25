/* eslint-disable camelcase */

exports.up = async (pgm) => {
  // Enable Row Level Security on all tenant-aware tables
  
  // 1. Enable RLS on tenants table
  pgm.sql('ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;');
  
  // System admins can see all tenants, users can only see their own tenant
  pgm.sql(`
    CREATE POLICY tenant_isolation ON tenants
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR 
      id = current_session_tenant_id()
    );
  `);

  // 2. Enable RLS on users table
  pgm.sql('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
  
  // System admins can see all users, regular users can see themselves and users in their businesses
  pgm.sql(`
    CREATE POLICY user_isolation ON users
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      id = current_session_user_id() OR
      EXISTS (
        SELECT 1 FROM user_business_roles ubr
        WHERE ubr.user_id = users.id
        AND EXISTS (
          SELECT 1 FROM businesses b
          WHERE b.id = ubr.business_id
          AND b.tenant_id = current_session_tenant_id()
        )
      )
    );
  `);

  // 3. Enable RLS on businesses table
  pgm.sql('ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY business_tenant_isolation ON businesses
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      tenant_id = current_session_tenant_id()
    );
  `);

  // 4. Enable RLS on employees table
  pgm.sql('ALTER TABLE employees ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY employee_business_isolation ON employees
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = employees.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 5. Enable RLS on user_business_roles table
  pgm.sql('ALTER TABLE user_business_roles ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY user_business_roles_isolation ON user_business_roles
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = user_business_roles.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 6. Enable RLS on service_categories table
  pgm.sql('ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY service_categories_business_isolation ON service_categories
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = service_categories.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 7. Enable RLS on services table
  pgm.sql('ALTER TABLE services ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY services_business_isolation ON services
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = services.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 8. Enable RLS on employee_services table
  pgm.sql('ALTER TABLE employee_services ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY employee_services_isolation ON employee_services
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      EXISTS (
        SELECT 1 FROM employees e
        JOIN businesses b ON b.id = e.business_id
        WHERE e.id = employee_services.employee_id
        AND (b.id = current_session_business_id() OR b.tenant_id = current_session_tenant_id())
      )
    );
  `);

  // 9. Enable RLS on working_hours table
  pgm.sql('ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY working_hours_isolation ON working_hours
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = working_hours.business_id
        AND b.tenant_id = current_session_tenant_id()
      ) OR
      EXISTS (
        SELECT 1 FROM employees e
        JOIN businesses b ON b.id = e.business_id
        WHERE e.id = working_hours.employee_id
        AND (b.id = current_session_business_id() OR b.tenant_id = current_session_tenant_id())
      )
    );
  `);

  // 10. Enable RLS on employee_availability_overrides table
  pgm.sql('ALTER TABLE employee_availability_overrides ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY employee_availability_overrides_isolation ON employee_availability_overrides
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      EXISTS (
        SELECT 1 FROM employees e
        JOIN businesses b ON b.id = e.business_id
        WHERE e.id = employee_availability_overrides.employee_id
        AND (b.id = current_session_business_id() OR b.tenant_id = current_session_tenant_id())
      )
    );
  `);

  // 11. Enable RLS on customers table
  pgm.sql('ALTER TABLE customers ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY customers_business_isolation ON customers
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = customers.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 12. Enable RLS on bookings table
  pgm.sql('ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY bookings_business_isolation ON bookings
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = bookings.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 13. Enable RLS on notifications table
  pgm.sql('ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY notifications_business_isolation ON notifications
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = notifications.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 14. Enable RLS on notification_templates table
  pgm.sql('ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY notification_templates_isolation ON notification_templates
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id IS NULL OR -- Global templates
      business_id = current_session_business_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = notification_templates.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 15. Enable RLS on notification_preferences table
  pgm.sql('ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY notification_preferences_isolation ON notification_preferences
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      business_id = current_session_business_id() OR
      user_id = current_session_user_id() OR
      EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.id = notification_preferences.business_id
        AND b.tenant_id = current_session_tenant_id()
      )
    );
  `);

  // 16. Enable RLS on tenant_subscriptions table
  pgm.sql('ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;');
  
  pgm.sql(`
    CREATE POLICY tenant_subscriptions_isolation ON tenant_subscriptions
    FOR ALL
    TO PUBLIC
    USING (
      is_system_admin() = true OR
      tenant_id = current_session_tenant_id()
    );
  `);

  // Auth tables - these don't need RLS as they're handled differently
  // token_blacklist, password_resets, email_verifications are user-specific
  // and handled by application logic rather than RLS
};

exports.down = async (pgm) => {
  // Disable RLS and drop policies
  
  const tables = [
    'tenant_subscriptions',
    'notification_preferences',
    'notification_templates', 
    'notifications',
    'bookings',
    'customers',
    'employee_availability_overrides',
    'working_hours',
    'employee_services',
    'services',
    'service_categories',
    'user_business_roles',
    'employees',
    'businesses',
    'users',
    'tenants'
  ];

  const policies = [
    'tenant_subscriptions_isolation',
    'notification_preferences_isolation',
    'notification_templates_isolation',
    'notifications_business_isolation',
    'bookings_business_isolation',
    'customers_business_isolation',
    'employee_availability_overrides_isolation',
    'working_hours_isolation',
    'employee_services_isolation',
    'services_business_isolation',
    'service_categories_business_isolation',
    'user_business_roles_isolation',
    'employee_business_isolation',
    'business_tenant_isolation',
    'user_isolation',
    'tenant_isolation'
  ];

  // Drop policies
  for (const policy of policies) {
    const tableName = tables[policies.indexOf(policy)];
    pgm.sql(`DROP POLICY IF EXISTS ${policy} ON ${tableName};`);
  }

  // Disable RLS
  for (const table of tables) {
    pgm.sql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
  }
};
