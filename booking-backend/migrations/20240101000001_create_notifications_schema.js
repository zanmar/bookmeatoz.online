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
  // Create notification-related ENUM types
  pgm.createType('notification_type_v1', [
    'booking_confirmation',
    'booking_reminder_24h',
    'booking_reminder_1h',
    'booking_cancellation',
    'booking_rescheduled',
    'employee_schedule_change',
    'system_maintenance',
    'payment_confirmation',
    'payment_failed'
  ]);

  pgm.createType('notification_status_v1', [
    'pending',
    'sent',
    'failed',
    'cancelled'
  ]);

  pgm.createType('notification_channel_v1', [
    'email',
    'sms',
    'push',
    'in_app'
  ]);

  // Create notifications table
  pgm.createTable('notifications', {
    ...createCommonEntityColumns(pgm),
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    user_id: { type: 'UUID', references: 'users(id)', onDelete: 'CASCADE' },
    customer_id: { type: 'UUID', references: 'customers(id)', onDelete: 'CASCADE' },
    booking_id: { type: 'UUID', references: 'bookings(id)', onDelete: 'CASCADE' },
    type: { type: 'notification_type_v1', notNull: true },
    channel: { type: 'notification_channel_v1', notNull: true },
    status: { type: 'notification_status_v1', notNull: true, default: 'pending' },
    subject: { type: 'VARCHAR(255)' },
    content: { type: 'TEXT', notNull: true },
    metadata: { type: 'JSONB', default: '{}' },
    scheduled_for: { type: 'TIMESTAMPTZ' },
    sent_at: { type: 'TIMESTAMPTZ' },
    failed_at: { type: 'TIMESTAMPTZ' },
    failure_reason: { type: 'TEXT' },
    retry_count: { type: 'INTEGER', default: 0 },
    max_retries: { type: 'INTEGER', default: 3 },
  });

  // Create indexes for notifications
  pgm.createIndex('notifications', 'business_id');
  pgm.createIndex('notifications', 'user_id');
  pgm.createIndex('notifications', 'customer_id');
  pgm.createIndex('notifications', 'booking_id');
  pgm.createIndex('notifications', 'type');
  pgm.createIndex('notifications', 'channel');
  pgm.createIndex('notifications', 'status');
  pgm.createIndex('notifications', 'scheduled_for');
  pgm.createIndex('notifications', ['status', 'scheduled_for']);
  pgm.createIndex('notifications', ['business_id', 'type']);

  createUpdatedAtTrigger(pgm, 'notifications');

  // Create notification templates table
  pgm.createTable('notification_templates', {
    ...createCommonEntityColumns(pgm),
    business_id: { type: 'UUID', references: 'businesses(id)', onDelete: 'CASCADE' },
    type: { type: 'notification_type_v1', notNull: true },
    channel: { type: 'notification_channel_v1', notNull: true },
    name: { type: 'VARCHAR(255)', notNull: true },
    subject_template: { type: 'VARCHAR(255)' },
    content_template: { type: 'TEXT', notNull: true },
    variables: { type: 'JSONB', default: '{}' },
    is_default: { type: 'BOOLEAN', notNull: true, default: false },
    is_active: { type: 'BOOLEAN', notNull: true, default: true },
  });

  // Create indexes for notification templates
  pgm.createIndex('notification_templates', 'business_id');
  pgm.createIndex('notification_templates', 'type');
  pgm.createIndex('notification_templates', 'channel');
  pgm.createIndex('notification_templates', ['type', 'channel']);
  pgm.createIndex('notification_templates', ['business_id', 'type', 'channel']);
  pgm.createIndex('notification_templates', 'is_default');
  pgm.createIndex('notification_templates', 'is_active');

  createUpdatedAtTrigger(pgm, 'notification_templates');

  // Create notification preferences table
  pgm.createTable('notification_preferences', {
    ...createCommonEntityColumns(pgm),
    user_id: { type: 'UUID', references: 'users(id)', onDelete: 'CASCADE' },
    customer_id: { type: 'UUID', references: 'customers(id)', onDelete: 'CASCADE' },
    business_id: { type: 'UUID', notNull: true, references: 'businesses(id)', onDelete: 'CASCADE' },
    notification_type: { type: 'notification_type_v1', notNull: true },
    email_enabled: { type: 'BOOLEAN', notNull: true, default: true },
    sms_enabled: { type: 'BOOLEAN', notNull: true, default: false },
    push_enabled: { type: 'BOOLEAN', notNull: true, default: true },
    in_app_enabled: { type: 'BOOLEAN', notNull: true, default: true },
  });

  // Create indexes for notification preferences
  pgm.createIndex('notification_preferences', 'user_id');
  pgm.createIndex('notification_preferences', 'customer_id');
  pgm.createIndex('notification_preferences', 'business_id');
  pgm.createIndex('notification_preferences', 'notification_type');
  pgm.createIndex('notification_preferences', ['user_id', 'business_id']);
  pgm.createIndex('notification_preferences', ['customer_id', 'business_id']);

  // Ensure only one of user_id or customer_id is set
  pgm.addConstraint('notification_preferences', 'check_user_or_customer', 
    'CHECK ((user_id IS NOT NULL AND customer_id IS NULL) OR (user_id IS NULL AND customer_id IS NOT NULL))');

  // Unique constraint to prevent duplicate preferences
  pgm.addConstraint('notification_preferences', 'unique_user_business_type', 
    'UNIQUE(user_id, business_id, notification_type) DEFERRABLE INITIALLY DEFERRED');
  pgm.addConstraint('notification_preferences', 'unique_customer_business_type', 
    'UNIQUE(customer_id, business_id, notification_type) DEFERRABLE INITIALLY DEFERRED');

  createUpdatedAtTrigger(pgm, 'notification_preferences');

  // Insert default notification templates
  pgm.sql(`
    INSERT INTO notification_templates (type, channel, name, subject_template, content_template, is_default, is_active) VALUES
    ('booking_confirmation', 'email', 'Booking Confirmation Email', 'Booking Confirmed - {{service_name}}', 
     'Hi {{customer_name}},\n\nYour booking for {{service_name}} has been confirmed.\n\nDetails:\nDate: {{booking_date}}\nTime: {{booking_time}}\nEmployee: {{employee_name}}\nDuration: {{service_duration}} minutes\n\nThank you!', 
     true, true),
    
    ('booking_reminder_24h', 'email', '24 Hour Reminder Email', 'Reminder - {{service_name}} Tomorrow', 
     'Hi {{customer_name}},\n\nThis is a reminder that you have an appointment tomorrow.\n\nDetails:\nService: {{service_name}}\nDate: {{booking_date}}\nTime: {{booking_time}}\nEmployee: {{employee_name}}\n\nSee you tomorrow!', 
     true, true),
     
    ('booking_reminder_1h', 'email', '1 Hour Reminder Email', 'Reminder - {{service_name}} in 1 Hour', 
     'Hi {{customer_name}},\n\nThis is a reminder that you have an appointment in 1 hour.\n\nDetails:\nService: {{service_name}}\nTime: {{booking_time}}\nEmployee: {{employee_name}}\n\nSee you soon!', 
     true, true),
     
    ('booking_cancellation', 'email', 'Booking Cancellation Email', 'Booking Cancelled - {{service_name}}', 
     'Hi {{customer_name}},\n\nYour booking for {{service_name}} on {{booking_date}} at {{booking_time}} has been cancelled.\n\nReason: {{cancellation_reason}}\n\nWe apologize for any inconvenience.', 
     true, true),
     
    ('booking_rescheduled', 'email', 'Booking Rescheduled Email', 'Booking Rescheduled - {{service_name}}', 
     'Hi {{customer_name}},\n\nYour booking for {{service_name}} has been rescheduled.\n\nNew Details:\nDate: {{new_booking_date}}\nTime: {{new_booking_time}}\nEmployee: {{employee_name}}\n\nThank you for your understanding!', 
     true, true);
  `);
};

exports.down = async (pgm) => {
  // Drop tables in reverse order
  pgm.dropTable('notification_preferences');
  pgm.dropTable('notification_templates');
  pgm.dropTable('notifications');

  // Drop ENUM types
  pgm.dropType('notification_channel_v1');
  pgm.dropType('notification_status_v1');
  pgm.dropType('notification_type_v1');
};
