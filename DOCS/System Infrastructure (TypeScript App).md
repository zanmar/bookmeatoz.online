System Infrastructure for BookMeAtOz (TypeScript Implementation)
This document outlines the system infrastructure for deploying, running, and monitoring the BookMeAtOz platform, which consists of a React/Vite frontend and a Node.js/Express backend.

1. Deployment Architecture Diagram
The platform is designed with a scalable, multi-tier architecture suitable for VPS deployment.

                               +-----------------+
                               |      User       |
                               +--------+--------+
                                        |
                                        ▼
                               +-----------------+
                               |    Cloudflare   |  <-- CDN, DNS, Basic WAF, SSL
                               |      (CDN)      |
                               +--------+--------+
                                        |
                                        ▼
+-----------------------------------------------------------------------------------+
|                                  VPS / Server(s)                                  |
| +-------------------------------------------------------------------------------+ |
| |                            Load Balancer / Reverse Proxy                        | |
| |                                 (Nginx / HAProxy)                               | |
| |                                (SSL Termination)                                | |
| +---------------------+----------------------^-----------------------+----------+ |
|                       |                      |                       |            |
|                       ▼                      |                       ▼            |
| +---------------------+-----+      +---------+----------+  +---------+----------+ |
| | Frontend Web Server(s)  |      | API Gateway/Router |  | WebSocket Server(s)| |
| | (Nginx serving Vite   |      | (Node.js/Express)  |  | (Node.js/Socket.IO)| |
| |  static build)        |      | Managed by PM2     |  | Managed by PM2     | |
| +---------------------+-----+      +---------+----------+  +---------+----------+ |
|                       |                      |                       |            |
|                       |                      | (If API Gateway is separate from   |
|                       |                      |  main backend services)           |
|                       |                      ▼                                  |
|                       |      +-------------------------------------+            |
|                       |      |      Backend Service Instances      |            |
|                       |      |        (Node.js/Express)          |            |
|                       |      |        Managed by PM2 (Cluster)   |            |
|                       |      +-----------------+-----------------+            |
|                       |                        |                              |
| +---------------------+----------------------+-+------------------------------+ |
| |                                        ▼                                    | |
| |                      +-----------------------------------+                  | |
| |                      |   Database Connection Pool        |                  | |
| |                      | (pg.Pool in Node.js / PgBouncer)  |                  | |
| |                      +-----------------+-----------------+                  | |
| |                                        ▼                                    | |
| |                      +-----------------------------------+                  | |
| |                      |      PostgreSQL Database          |                  | |
| |                      | (Primary with Read Replicas plan) |                  | |
| |                      +-----------------------------------+                  | |
| |                                        |                                    | |
| |                      +-----------------------------------+                  | |
| |                      |      Redis (Optional Cache /      |                  | |
| |                      |         Message Queue Broker)     |                  | |
| |                      +-----------------------------------+                  | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
       |                                      |                                  |
       ▼                                      ▼                                  ▼
+-----------------+                   +-----------------+                +-----------------+
| Monitoring      |                   | Logging         |                | Email Service   |
| (Prometheus,    |                   | (Winston files, |                | (SMTP Provider) |
|  Grafana)       |                   |  ELK Stack etc.)|                +-----------------+
+-----------------+                   +-----------------+


CDN (Cloudflare): Serves static frontend assets, provides DNS, SSL, and basic security (WAF, DDoS mitigation).

Load Balancer / Reverse Proxy (Nginx): Deployed on the VPS. It handles incoming traffic, terminates SSL, distributes requests to frontend or backend services, and can provide caching for API responses.

Frontend Web Server (Nginx): Serves the static build of the React/Vite application.

API Gateway/Router & Backend Services (Node.js/Express with PM2): The TypeScript backend application runs as multiple instances managed by PM2 in cluster mode to utilize all CPU cores. It handles API requests, business logic, and interacts with the database.

WebSocket Server (Node.js/Socket.IO with PM2): Integrated with the Express server or as a separate process, managed by PM2. For scaling across multiple instances, a Redis adapter is necessary for Socket.IO.

Database Connection Pool (pg.Pool / PgBouncer): The Node.js application uses its built-in pg.Pool for efficient connection management. For larger-scale deployments, an external pooler like PgBouncer might be considered.

PostgreSQL Database: The primary data store, with plans for read replicas to scale read operations.

Redis (Optional): Can be used for caching, session management (if not purely JWT), and as a message broker for a job queue system (e.g., BullMQ).

Monitoring & Logging: Dedicated systems for observing application health and performance.

Email Service: External SMTP provider for sending transactional emails.

2. Server Configuration Specifics
a. Frontend Server (Nginx for Vite Static Build)
Nginx is configured to serve the static files generated by vite build and handle client-side routing for the SPA.

# /etc/nginx/sites-available/bookmeatoz.online.conf (Example)

# Upstream for backend API servers managed by PM2
upstream backend_api_servers {
    # PM2 typically listens on different ports for each instance, or a single port if not clustered.
    # If PM2 is on the same machine, use 127.0.0.1
    server 127.0.0.1:8083; # Example port for backend instance 1
    server 127.0.0.1:8084; # Example port for backend instance 2
    keepalive 32;
}

# Upstream for WebSocket server (if separate from API)
# upstream websocket_servers {
#   server 127.0.0.1:8080; # Example port for WebSocket server
# }

server {
    listen 80;
    server_name bookmeatoz.online www.bookmeatoz.online *.bookmeatoz.online; # Handles main and subdomains

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt; # Dedicated root for challenges
    }
}

server {
    listen 443 ssl http2;
    server_name bookmeatoz.online www.bookmeatoz.online *.bookmeatoz.online; # Wildcard for subdomains

    # SSL Configuration (using Let's Encrypt or other provider)
    ssl_certificate /etc/letsencrypt/live/bookmeatoz.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bookmeatoz.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf; # Recommended SSL parameters
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    # add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."; # Define a strong CSP

    # Path to the frontend static build (output of `vite build`)
    # This path depends on your deployment script.
    root /var/www/bookmeatoz.online_ts/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html; # Handles SPA routing
    }

    # Static asset caching
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1M; # Cache for 1 month
        access_log off;
        add_header Cache-Control "public";
    }

    # API Proxy to backend Node.js application (managed by PM2)
    location /api/ {
        proxy_pass http://backend_api_servers; # Matches upstream name
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host; # Crucial for subdomain detection by backend
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_buffering off; # Useful for streaming or long-polling if any
        proxy_read_timeout 90s; # Adjust as needed
        proxy_redirect off;
    }

    # WebSocket Proxy (if Socket.IO runs on a different port/path than API)
    # location /socket.io/ {
    #     proxy_pass http://websocket_servers; # Or same as backend_api_servers if integrated
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection "upgrade";
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    # }

    # Error pages (optional)
    # error_page 500 502 503 504 /50x.html;
    # location = /50x.html {
    //     root /usr/share/nginx/html; # Or your custom error page location
    // }
}

b. Backend Node.js Configuration (PM2)
The backend Node.js/Express.js application (built TypeScript to JavaScript in dist/) is managed by PM2 for production.

ecosystem.config.js (in backend root):

module.exports = {
  apps: [{
    name: "bookmeatoz-api",
    script: "./dist/server.js", // Entry point of the compiled application
    instances: "max", // "max" to utilize all available CPUs, or a specific number
    exec_mode: "cluster", // Enables load balancing across instances
    watch: false, // Should be false in production; use restart strategies instead
    max_memory_restart: '512M', // Example: Restart if an instance exceeds 512MB RAM
    env_production: {
      NODE_ENV: "production",
      // PORT: 8084, // PM2 can manage ports or you can assign ranges if needed
      // Other production-specific environment variables can be set here,
      // but prefer .env files loaded by dotenv for secrets.
    },
    // Logging configuration
    log_date_format: "YYYY-MM-DD HH:mm Z",
    out_file: "/var/log/pm2/bookmeatoz-api-out.log", // Ensure this path is writable by PM2 user
    error_file: "/var/log/pm2/bookmeatoz-api-error.log",
    merge_logs: true, // Merge logs from all instances if using cluster mode
    // Restart strategy
    autorestart: true,
    cron_restart: "0 3 * * *", // Example: Restart every day at 3 AM
    restart_delay: 5000, // Delay before restarting (ms)
  }]
};

Starting with PM2:

pm2 start ecosystem.config.js --env production
pm2 startup # To ensure PM2 restarts on server reboot
pm2 save

Environment Variables: The Node.js application uses dotenv to load variables from a .env file in production. This file should contain database credentials, JWT secrets, API keys, email service configuration, etc.

c. Database Configuration (PostgreSQL)
Key postgresql.conf settings for performance (typically managed by DBAs or cloud providers, but good to be aware of for self-hosted VPS):

max_connections: Set appropriately based on application needs and server resources (consider PgBouncer if many app instances).

shared_buffers: Typically 25% of system RAM.

effective_cache_size: Typically 50-75% of system RAM.

work_mem: For sorting/hashing, increase for complex queries (e.g., 16MB-64MB).

maintenance_work_mem: For VACUUM, CREATE INDEX (e.g., 256MB-1GB).

checkpoint_completion_target = 0.9

wal_buffers = 16MB

default_statistics_target = 100 (or higher for complex schemas).

autovacuum = on (ensure it's running effectively).

d. Database Connection Pool (pg.Pool / PgBouncer)
pg.Pool (Node.js): The backend application (src/config/db.ts) uses the pg library's built-in connection pooling. This is configured with max connections per Node.js instance.

PgBouncer (Optional External Pooler): For very high numbers of backend application instances or short-lived connections, PgBouncer can be placed between the application and PostgreSQL. It manages a smaller pool of actual connections to PostgreSQL, improving performance and reducing resource usage on the database server. If using PgBouncer, the Node.js application connects to PgBouncer instead of directly to PostgreSQL.

3. Load Balancing Implementation
CDN (Cloudflare): Provides global load balancing for static assets and initial request routing.

Nginx (on VPS): Acts as a reverse proxy and load balancer for the backend API instances managed by PM2 (using the upstream block). It can use strategies like round_robin (default) or least_conn.

PM2 Cluster Mode: Provides internal load balancing across multiple Node.js instances running on the same server, distributing requests among them.

4. Monitoring and Logging Strategies
a. Application Logging (Backend - Winston)
Configuration (src/utils/logger.ts):

Structured JSON logs for production.

Leveled logging (error, warn, info, http, debug).

Transports for console (development) and files (e.g., logs/error.log, logs/combined.log).

Log rotation should be handled by an external tool like logrotate.

Request Logging (Morgan + Winston): Morgan middleware is used to log HTTP requests, piped to Winston for consistent formatting and storage.

Contextual Logging: AsyncLocalStorage helps propagate requestId, tenantId, userId to log entries for better traceability.

b. Database Monitoring
PostgreSQL internal statistics tables (pg_stat_activity, pg_stat_statements extension).

Tools like pgAdmin, pgMonitor, or cloud provider monitoring dashboards.

c. Infrastructure & Application Metrics (Prometheus & Grafana - Conceptual/Planned)
Prometheus: An open-source monitoring system for collecting time-series data.

Backend (prom-client library): Exposes an HTTP endpoint (e.g., /metrics) with application metrics (default Node.js metrics, HTTP request durations/counts, custom business metrics like active bookings).

Grafana: An open-source platform for analytics and interactive visualization, used to create dashboards from Prometheus data.

// Conceptual prom-client setup in backend (e.g., in app.ts or a metrics module)
// const promClient = require('prom-client');
// const collectDefaultMetrics = promClient.collectDefaultMetrics;
// collectDefaultMetrics({ timeout: 5000 });
// const httpRequestDurationMicroseconds = new promClient.Histogram({ /* ... */ });
// app.get('/metrics', async (req, res) => {
//   res.set('Content-Type', promClient.register.contentType);
//   res.end(await promClient.register.metrics());
// });

5. Environment Configuration
Sensitive configurations (database credentials, API keys, JWT secrets) are managed using environment variables.

.env files are used for local development (loaded by dotenv).

In production on a VPS, environment variables are set directly for the PM2 process or loaded from a .env file secured with appropriate permissions.

6. CI/CD Pipeline (Conceptual)
A CI/CD pipeline (e.g., using GitHub Actions, Jenkins, GitLab CI) is planned for:

Automated builds for frontend and backend.

Running unit and integration tests.

Linting and code quality checks.

Automated deployment to staging and production environments on the VPS (e.g., using SSH, rsync, or Docker deployments).

This infrastructure setup aims for a balance of performance, scalability, and maintainability for the BookMeAtOz platform on a VPS environment.