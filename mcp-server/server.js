/**
 * BookMeAtOz MCP Server
 * Model Context Protocol server for integration with AI assistants
 */

// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

// Load MCP configuration
let mcpConfig = {
  config: {
    port: 7331,
    host: '0.0.0.0',
    logging: {
      level: 'info',
      directory: path.join(__dirname, 'logs')
    },
    database: {
      central: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'bookmeatoz'
      }
    }
  }
};

console.log('Using hardcoded MCP configuration');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up configuration
const PORT = process.env.PORT || mcpConfig.config.port || 7331;
const HOST = process.env.HOST || mcpConfig.config.host || '0.0.0.0';
const LOG_DIR = path.join(__dirname, 'logs');

// Set up logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 
         (mcpConfig.config && mcpConfig.config.logging ? mcpConfig.config.logging.level : 'info'),
  format: winston.format.json(),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log')
    })
  ]
});

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  logger.info(`Created logs directory: ${LOG_DIR}`);
}

// Configure central database pool
const centralDbPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'bookmeatoz',
  max: 20,
  idleTimeoutMillis: 30000
});

// Store tenant database connection pools
const tenantPools = new Map();

// Configure middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow SSE
  crossOriginEmbedderPolicy: false, // Allow cross-origin
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// JWT Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For MCP server, we'll allow unauthenticated requests for now
    // but mark the request as unauthenticated
    req.authenticated = false;
    return next();
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bookmeatoz-super-secret-key');
    req.user = decoded;
    req.authenticated = true;
    next();
  } catch (error) {
    req.authenticated = false;
    logger.warn('Invalid token', { error: error.message });
    next();
  }
};

// Tenant resolution middleware
const resolveTenant = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
  
  if (!tenantId) {
    // No tenant specified, just use central database
    req.tenantId = null;
    return next();
  }
  
  req.tenantId = tenantId;
  next();
};

// Apply middleware
app.use(authenticate);
app.use(resolveTenant);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok ok' });
});

// Root route - redirect to /sse if reconnect parameter is present
app.get('/', (req, res) => {
  if (req.query.reconnect) {
    logger.info('Redirecting from root to /sse endpoint');
    return res.redirect('/sse?reconnect=' + req.query.reconnect);
  }
  res.json({ status: 'ok', message: 'BookMeAtOz MCP Server. Use /sse endpoint for SSE connections.' });
});

// Server-Sent Events (SSE) endpoint for Cursor
app.get('/sse', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection established message in the correct format
  const initialMessage = {
    jsonrpc: "2.0",
    method: "connection",
    params: { version: "0.1.0", status: "connected" }
  };
  res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);
  
  // Send capability registration
  setTimeout(() => {
    // Describe server capabilities
    const registrationMessage = {
      jsonrpc: "2.0",
      method: "register",
      params: {
        type: "mcp-server",
        name: "BookMeAtOz MCP Server",
        version: "1.0.0",
        tools: [
          {
            name: "database",
            description: "Database operations for BookMeAtOz",
            capabilities: [
              {
                name: "query",
                description: "Execute a SQL query",
                parameters: {
                  sql: {
                    type: "string",
                    description: "SQL query to execute"
                  },
                  params: {
                    type: "array",
                    description: "Array of parameters for the query"
                  }
                }
              },
              {
                name: "list_tables",
                description: "List all tables in the database",
                parameters: {}
              },
              {
                name: "describe_table",
                description: "Get information about a table's structure",
                parameters: {
                  table_name: {
                    type: "string",
                    description: "Name of the table to describe"
                  }
                }
              }
            ]
          },
          {
            name: "file_system",
            description: "File operations for BookMeAtOz",
            capabilities: [
              {
                name: "read_file",
                description: "Read a file from the server",
                parameters: {
                  path: {
                    type: "string",
                    description: "Path to the file"
                  }
                }
              },
              {
                name: "write_file",
                description: "Write content to a file",
                parameters: {
                  path: {
                    type: "string",
                    description: "Path to the file"
                  },
                  content: {
                    type: "string",
                    description: "Content to write"
                  }
                }
              },
              {
                name: "list_dir",
                description: "List directory contents",
                parameters: {
                  path: {
                    type: "string",
                    description: "Path to the directory"
                  }
                }
              }
            ]
          },
          {
            name: "booking",
            description: "Booking operations for BookMeAtOz",
            capabilities: [
              {
                name: "get_bookings",
                description: "Get a list of bookings",
                parameters: {}
              },
              {
                name: "create_booking",
                description: "Create a new booking",
                parameters: {
                  customer: {
                    type: "string",
                    description: "Customer name"
                  },
                  service: {
                    type: "string",
                    description: "Service name"
                  },
                  date: {
                    type: "string",
                    description: "Booking date (YYYY-MM-DD)"
                  },
                  time: {
                    type: "string",
                    description: "Booking time (HH:MM)"
                  }
                }
              },
              {
                name: "check_availability",
                description: "Check available time slots for a date",
                parameters: {
                  date: {
                    type: "string",
                    description: "Date to check (YYYY-MM-DD)"
                  }
                }
              }
            ]
          }
        ]
      }
    };
    res.write(`data: ${JSON.stringify(registrationMessage)}\n\n`);
  }, 500);
  
  // Keep the connection alive with a heartbeat
  const heartbeatInterval = setInterval(() => {
    const heartbeatMessage = {
      jsonrpc: "2.0",
      method: "heartbeat",
      params: { timestamp: new Date().toISOString() }
    };
    res.write(`data: ${JSON.stringify(heartbeatMessage)}\n\n`);
  }, 30000); // Send heartbeat every 30 seconds
  
  // Close heartbeat when client disconnects
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    logger.info('SSE client disconnected');
  });
  
  logger.info('SSE client connected');
});

// MCP protocol endpoints
app.post('/tools/:toolName/:capability', async (req, res) => {
  const { toolName, capability } = req.params;
  const params = req.body;
  
  logger.info(`Tool call: ${toolName}.${capability}`, { params });
  
  try {
    // Simple validation of supported tools and capabilities
    const supportedTools = {
      database: ['query', 'list_tables', 'describe_table'],
      file_system: ['read_file', 'write_file', 'list_dir'],
      booking: ['get_bookings', 'create_booking', 'check_availability'],
      git: ['status', 'commit', 'push']
    };
    
    if (!supportedTools[toolName]) {
      return res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: `Tool ${toolName} not found`
        },
        id: params.id || null
      });
    }
    
    if (!supportedTools[toolName].includes(capability)) {
      return res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: `Capability ${capability} not found in tool ${toolName}`
        },
        id: params.id || null
      });
    }
    
    // Execute the tool capability and return result in jsonrpc format
    let result;
    switch (toolName) {
      case 'database':
        result = await handleDatabaseTool(capability, params, req, res);
        break;
      case 'file_system':
        result = await handleFileSystemTool(capability, params, req, res);
        break;
      case 'git':
        result = await handleGitTool(capability, params, req, res);
        break;
      case 'booking':
        result = await handleBookingTool(capability, params, req, res);
        break;
      default:
        return res.status(501).json({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Tool ${toolName} not implemented yet`
          },
          id: params.id || null
        });
    }
    
    // Send response in jsonrpc format
    res.json({
      jsonrpc: "2.0",
      result: result,
      id: params.id || null
    });
    
  } catch (error) {
    logger.error(`Error executing tool ${toolName}.${capability}`, { error: error.message, stack: error.stack });
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: error.message
      },
      id: params.id || null
    });
  }
});

// Get or create tenant database pool
async function getTenantPool(tenantId) {
  if (tenantPools.has(tenantId)) {
    return tenantPools.get(tenantId);
  }
  
  // Get tenant database connection info from central DB
  const client = await centralDbPool.connect();
  try {
    const result = await client.query(
      'SELECT db_name, db_user, db_password, db_host, db_port FROM businesses WHERE id = $1',
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    
    const { db_name, db_user, db_password, db_host, db_port } = result.rows[0];
    
    // Create new pool for tenant
    const pool = new Pool({
      host: db_host || 'localhost',
      port: parseInt(db_port || '5432'),
      user: db_user,
      password: db_password,
      database: db_name,
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000
    });
    
    // Store in cache
    tenantPools.set(tenantId, pool);
    logger.info(`Created connection pool for tenant ${tenantId}`);
    
    return pool;
  } finally {
    client.release();
  }
}

// Database tool handler
async function handleDatabaseTool(capability, params, req, res) {
  const tenantId = params.tenant_id || req.tenantId;
  
  try {
    switch (capability) {
      case 'query':
        // Execute SQL query
        if (!params.sql) {
          throw new Error('SQL query is required');
        }
        
        // Validate that this is a read-only query
        const sqlLower = params.sql.toLowerCase().trim();
        if (sqlLower.startsWith('insert ') || 
            sqlLower.startsWith('update ') || 
            sqlLower.startsWith('delete ') || 
            sqlLower.startsWith('drop ') || 
            sqlLower.startsWith('alter ') || 
            sqlLower.startsWith('create ') ||
            sqlLower.includes('truncate ') ||
            sqlLower.includes('grant ') ||
            sqlLower.includes('execute ')) {
          throw new Error('Only read-only queries are allowed through the MCP server');
        }
        
        let pool;
        if (tenantId) {
          // Use tenant-specific database
          pool = await getTenantPool(tenantId);
        } else {
          // Use central database
          pool = centralDbPool;
        }
        
        // Execute query within a read-only transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY');
          const result = await client.query(params.sql, params.params || []);
          await client.query('COMMIT');
          return { rows: result.rows, rowCount: result.rowCount };
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
        
      case 'list_tables':
        // List all tables in database
        let listPool;
        if (tenantId) {
          listPool = await getTenantPool(tenantId);
        } else {
          listPool = centralDbPool;
        }
        
        const tablesQuery = `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `;
        
        // Execute in read-only transaction
        const listClient = await listPool.connect();
        try {
          await listClient.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY');
          const tables = await listClient.query(tablesQuery);
          await listClient.query('COMMIT');
          return { tables: tables.rows.map(row => row.table_name) };
        } catch (error) {
          await listClient.query('ROLLBACK');
          throw error;
        } finally {
          listClient.release();
        }
        
      case 'describe_table':
        // Describe table structure
        if (!params.table_name) {
          throw new Error('Table name is required');
        }
        
        let describePool;
        if (tenantId) {
          describePool = await getTenantPool(tenantId);
        } else {
          describePool = centralDbPool;
        }
        
        // Execute in read-only transaction
        const describeClient = await describePool.connect();
        try {
          await describeClient.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY');
          
          // First, validate the table exists to prevent SQL injection
          const tableExistsQuery = `
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = $1
            );
          `;
          const tableExists = await describeClient.query(tableExistsQuery, [params.table_name]);
          
          if (!tableExists.rows[0].exists) {
            throw new Error(`Table '${params.table_name}' does not exist`);
          }
          
          // Now get the column information
          const columnsQuery = `
            SELECT 
              column_name, 
              data_type, 
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position;
          `;
          
          const columns = await describeClient.query(columnsQuery, [params.table_name]);
          
          // Get primary key information
          const pkQuery = `
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = $1::regclass AND i.indisprimary;
          `;
          
          const primaryKeys = await describeClient.query(pkQuery, [params.table_name]);
          
          await describeClient.query('COMMIT');
          
          return { 
            table_name: params.table_name,
            columns: columns.rows,
            primary_keys: primaryKeys.rows.map(row => row.attname)
          };
        } catch (error) {
          await describeClient.query('ROLLBACK');
          throw error;
        } finally {
          describeClient.release();
        }
      
      default:
        throw new Error(`Database capability ${capability} not implemented yet`);
    }
  } catch (error) {
    logger.error(`Error in database tool: ${capability}`, { error: error.message });
    throw error;
  }
}

// File system tool handler
async function handleFileSystemTool(capability, params, req, res) {
  try {
    switch (capability) {
      case 'read_file':
        // Read file
        if (!params.path) {
          throw new Error('File path is required');
        }
        
        // Validate and sanitize path to prevent directory traversal
        const readPath = path.normalize(params.path);
        if (readPath.includes('..')) {
          throw new Error('Invalid file path');
        }
        
        if (!fs.existsSync(readPath)) {
          throw new Error('File not found');
        }
        
        const content = fs.readFileSync(readPath, 'utf8');
        return { content };
        
      case 'write_file':
        // Write to file
        if (!params.path || params.content === undefined) {
          throw new Error('File path and content are required');
        }
        
        // Validate and sanitize path
        const writePath = path.normalize(params.path);
        if (writePath.includes('..')) {
          throw new Error('Invalid file path');
        }
        
        // Create directory if it doesn't exist
        const dir = path.dirname(writePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(writePath, params.content);
        return { success: true, path: writePath };
        
      case 'list_dir':
        // List directory contents
        if (!params.path) {
          throw new Error('Directory path is required');
        }
        
        // Validate and sanitize path
        const dirPath = path.normalize(params.path);
        if (dirPath.includes('..')) {
          throw new Error('Invalid directory path');
        }
        
        if (!fs.existsSync(dirPath)) {
          throw new Error('Directory not found');
        }
        
        if (!fs.statSync(dirPath).isDirectory()) {
          throw new Error('Path is not a directory');
        }
        
        const items = fs.readdirSync(dirPath);
        const contents = items.map(item => {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          return {
            name: item,
            path: itemPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime
          };
        });
        
        return { contents };
        
      default:
        throw new Error(`File system capability ${capability} not implemented yet`);
    }
  } catch (error) {
    logger.error(`Error in file system tool: ${capability}`, { error: error.message });
    throw error;
  }
}

// Git tool handler
async function handleGitTool(capability, params, req, res) {
  try {
    // Git operations would require exec/spawn to run git commands
    // For now, return placeholder data
    return { message: `Git capability ${capability} not implemented yet` };
  } catch (error) {
    logger.error(`Error in git tool: ${capability}`, { error: error.message });
    throw error;
  }
}

// Booking tool handler
async function handleBookingTool(capability, params, req, res) {
  try {
    // Return different data based on requested capability
    switch (capability) {
      case 'get_bookings':
        return {
          bookings: [
            { id: 1, customer: "John Doe", service: "Haircut", date: "2025-05-20", time: "10:00" },
            { id: 2, customer: "Jane Smith", service: "Massage", date: "2025-05-21", time: "14:30" }
          ]
        };
      
      case 'create_booking':
        // Validate booking data
        if (!params.customer || !params.service || !params.date || !params.time) {
          throw new Error('Missing required booking information');
        }
        
        // Here you would normally save to database
        return { 
          id: Math.floor(Math.random() * 1000),
          customer: params.customer,
          service: params.service,
          date: params.date,
          time: params.time,
          created: new Date().toISOString()
        };
        
      case 'check_availability':
        if (!params.date) {
          throw new Error('Date is required');
        }
        
        // Here you would normally check database
        return { 
          available_slots: ["9:00", "10:00", "11:00", "14:00", "15:00"],
          date: params.date
        };
        
      default:
        throw new Error(`Booking capability ${capability} not implemented yet`);
    }
  } catch (error) {
    logger.error(`Error in booking tool: ${capability}`, { error: error.message });
    throw error;
  }
}

// Start server
server.listen(PORT, HOST, () => {
  logger.info(`MCP Server running at http://${HOST}:${PORT}`);
  logger.info(`Health check available at http://${HOST}:${PORT}/health`);
  
  // Create WebSocket server
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');
    
    ws.on('message', (message) => {
      logger.debug('Received WebSocket message', { message });
      
      try {
        const data = JSON.parse(message);
        // Handle WebSocket messages here
      } catch (error) {
        logger.error('Error processing WebSocket message', { error: error.message });
      }
    });
    
    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });
  });
});

// Handle shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    centralDbPool.end();
    
    // Close all tenant pools
    for (const [tenantId, pool] of tenantPools.entries()) {
      pool.end();
      logger.info(`Closed pool for tenant ${tenantId}`);
    }
    
    process.exit(0);
  });
});

module.exports = server; // For testing 