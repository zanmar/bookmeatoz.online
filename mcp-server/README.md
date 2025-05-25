# BookMeAtOz MCP Server

Model Context Protocol (MCP) server for the BookMeAtOz multi-tenant booking platform. This server enables AI assistants to interact with the booking system through a standardized interface.

## Features

- Multi-tenant PostgreSQL database integration
- File system operations for templates and assets
- Real-time booking system integration
- Memory context preservation with Qdrant
- JWT authentication and authorization
- Secure tenant isolation

## Installation

### Prerequisites

- Node.js 16.0.0 or later
- PostgreSQL database server
- Qdrant vector database (optional, for memory functionality)
- PM2 for production deployment (optional)

### Quick Install

```bash
# Clone the repository (if needed)
git clone https://your-repo-url/bookmeatoz-mcp.git
cd bookmeatoz-mcp

# Run the installation script
chmod +x install.sh
./install.sh
```

The installation script will:
1. Create necessary directories
2. Set up the `.env` file with default configuration
3. Install dependencies
4. Create a PM2 ecosystem configuration
5. Set up Cursor MCP configuration

### Manual Installation

1. Create a `.env` file with the required environment variables (see Configuration section)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Configuration

Configure the server using environment variables or `.env` file:

### Server Settings
- `PORT`: Port to run the server on (default: 7331)
- `HOST`: Host to bind to (default: localhost, use 0.0.0.0 for external access)
- `NODE_ENV`: Environment (development, production)

### Database Configuration
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_DATABASE`: PostgreSQL database name
- `DB_TYPE`: Database type (postgres)

### Authentication
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRATION`: Token expiration time (e.g., 24h)

### Logging
- `LOG_LEVEL`: Logging level (default: info)
- `LOG_FORMAT`: Log format (default: json)
- `LOG_DIR`: Directory for log files (default: ./logs)

### Memory (Qdrant)
- `QDRANT_URL`: URL for Qdrant server
- `QDRANT_COLLECTION`: Collection name in Qdrant

## Usage

### Starting the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
# With Node.js
npm start

# With PM2
pm2 start ecosystem.config.js
```

### Health Check

Verify the server is running:
```
http://your-server:7331/health
```

Should return:
```json
{
  "status": "ok ok"
}
```

## Connecting from Cursor

To use this MCP server with Cursor AI on your Windows machine:

1. Create or edit the file at `C:\Users\zanko\.cursor\mcp.json`
2. Add the following configuration:
   ```json
   {
     "servers": [
       {
         "name": "BookMeAtOz MCP Server",
         "url": "http://YOUR_VPS_IP:7331",
         "enabled": true
       }
     ]
   }
   ```
3. Replace `YOUR_VPS_IP` with your actual VPS IP address
4. Restart Cursor

If you're using SSH to access your VPS, you may need to set up an SSH tunnel:
```bash
ssh -L 7331:localhost:7331 user@YOUR_VPS_IP
```

## Available Tools

### Database Operations
- `database.query`: Execute SQL queries on tenant databases
- `database.transaction`: Run database transactions
- `database.create_tenant_db`: Create new tenant databases

### File System Operations
- `file_system.read`: Read file contents
- `file_system.write`: Write to files
- `file_system.upload_template`: Upload website templates

### Booking Operations
- `booking.create_booking`: Create new bookings
- `booking.check_availability`: Check time slot availability

## Security

- All database operations respect tenant isolation
- JWT authentication for secure access
- Input validation for all endpoints
- Path normalization to prevent directory traversal
- Parameterized SQL queries to prevent injection

## License

This project is licensed under the MIT License - see the LICENSE file for details. 