#!/bin/bash

# BookMeAtOz MCP Server installation script

echo "Installing BookMeAtOz MCP Server..."
echo ""

# Create necessary directories
mkdir -p logs

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
# Server Configuration
PORT=7331
HOST=0.0.0.0  # To allow external connections

# Central Database - Using the provided credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=bookmeatoz_root
DB_PASSWORD=Goliam25!vodolei
DB_DATABASE=bookmeatoz_db
DB_TYPE=postgres

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=24h

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=bookmeatoz_memory

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DIR=./logs

# CORS Settings
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,PATCH
CORS_HEADERS=Content-Type,Authorization,X-Tenant-ID

# Node Environment
NODE_ENV=production
EOL
  echo "Created .env file."
else
  echo ".env file already exists, skipping."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create ecosystem.config.js for PM2
if [ ! -f ecosystem.config.js ]; then
  echo "Creating PM2 configuration..."
  cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: "bookmeatoz-mcp",
    script: "./server.js",
    cwd: "/var/www/bookmeatoz.online/mcp-server",
    env: {
      NODE_PATH: "/var/www/bookmeatoz.online/mcp-server/node_modules",
      PORT: 7331,
      HOST: "0.0.0.0"
    },
    error_file: "/var/www/bookmeatoz.online/mcp-server/logs/err.log",
    out_file: "/var/www/bookmeatoz.online/mcp-server/logs/out.log",
    max_memory_restart: "256M",
    kill_timeout: 3000,
    max_restarts: 10,
    restart_delay: 3000,
    node_args: "--max-old-space-size=256",
    exec_mode: "fork",
    instances: 1,
    watch: false,
    autorestart: true,
    wait_ready: true,
    listen_timeout: 30000,
    source_map_support: false,
    merge_logs: true
  }]
};
EOL
  echo "Created PM2 configuration."
else
  echo "PM2 configuration already exists, skipping."
fi

# Create Cursor MCP configuration
echo "Creating Cursor MCP configuration..."
mkdir -p ../.cursor

# Create Cursor MCP configuration if it doesn't exist
if [ ! -f ../.cursor/mcp.json ]; then
  echo "Creating Cursor MCP configuration..."
  cat > ../.cursor/mcp.json << EOL
{
  "servers": [
    {
      "name": "BookMeAtOz MCP Server",
      "url": "http://localhost:7331",
      "enabled": true
    }
  ]
}
EOL
  echo "Created Cursor MCP configuration."
else
  echo "Cursor MCP configuration already exists, skipping."
fi

echo ""
echo "Installation completed successfully!"
echo ""
echo "To start the MCP server, run:"
echo "  npm start           # For direct start"
echo "  npm run dev         # For development with auto-reload"
echo "  pm2 start ecosystem.config.js  # For production with PM2"
echo ""
echo "The MCP server will be available at: http://YOUR_SERVER_IP:7331"
echo "Health check endpoint: http://YOUR_SERVER_IP:7331/health"
echo ""
echo "On your Windows machine, configure Cursor by adding this to C:\\Users\\zanko\\.cursor\\mcp.json:"
echo '{
  "servers": [
    {
      "name": "BookMeAtOz MCP Server",
      "url": "http://YOUR_VPS_IP:7331",
      "enabled": true
    }
  ]
}'
echo ""
echo "Replace YOUR_VPS_IP with your actual VPS IP address."
echo "" 