module.exports = {
  apps: [
    {
      name: 'tremelikos',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/tremelikos',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/tremelikos-error.log',
      out_file: '/var/log/pm2/tremelikos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
