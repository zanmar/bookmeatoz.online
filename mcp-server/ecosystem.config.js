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
