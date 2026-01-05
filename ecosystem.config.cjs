module.exports = {
  apps: [
    {
      name: "quantum-simulator-app",
      script: "npx",
      args: "vite preview --host 0.0.0.0 --port 25578",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: "25578",
        HOST: "0.0.0.0"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "25578",
        HOST: "0.0.0.0"
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: "25579",
        HOST: "0.0.0.0"
      },
      env_development: {
        NODE_ENV: "development",
        PORT: "3000",
        HOST: "0.0.0.0"
      },
      env_pterodactyl: {
        NODE_ENV: "production",
        PORT: "25578",
        HOST: "0.0.0.0",
        // Pterodactyl-specific optimizations
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: "25578",
        PM2_SERVE_SPA: "true"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/app-error.log",
      out_file: "./logs/app-out.log",
      log_file: "./logs/app-combined.log",
      time: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      shutdown_with_message: true,
      source_map_support: false,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      exec_mode: "fork",
      // Health check configuration
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Process stability settings
      exponential_backoff_restart_delay: 100,
      // Memory and CPU monitoring
      monitoring: true,
      pmx: true
    },
    {
      name: "quantum-simulator-static",
      script: "serve",
      args: "-s dist -l 25578 -H 0.0.0.0",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: "25578"
      },
      env_production: {
        NODE_ENV: "production", 
        PORT: "25578"
      },
      env_pterodactyl: {
        NODE_ENV: "production",
        PORT: "25578"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "./logs/static-error.log",
      out_file: "./logs/static-out.log",
      log_file: "./logs/static-combined.log",
      time: true,
      max_restarts: 5,
      min_uptime: "5s",
      restart_delay: 2000,
      kill_timeout: 3000,
      exec_mode: "fork",
      // This app is disabled by default - enable for static file serving
      disabled: true
    }
  ],

  deploy: {
    production: {
      user: "node",
      host: "localhost",
      ref: "origin/main",
      repo: "git@github.com:username/quantum-simulator.git",
      path: "/var/www/quantum-simulator",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production",
      "pre-setup": ""
    },
    staging: {
      user: "node", 
      host: "localhost",
      ref: "origin/develop",
      repo: "git@github.com:username/quantum-simulator.git",
      path: "/var/www/quantum-simulator-staging",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.cjs --env staging",
      "pre-setup": ""
    },
    pterodactyl: {
      user: "container",
      host: "localhost", 
      ref: "origin/main",
      repo: "git@github.com:username/quantum-simulator.git",
      path: "/home/container/quantum-simulator",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.cjs --env pterodactyl",
      "pre-setup": "mkdir -p logs"
    }
  }
};