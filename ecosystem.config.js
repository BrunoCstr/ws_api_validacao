// Configuração do PM2 para produção
// Uso: pm2 start ecosystem.config.js

module.exports = {
    apps: [
        {
            name: 'api-validacao',
            script: 'index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            // Logs
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            // Restart policy
            exp_backoff_restart_delay: 100,
            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 3000
        }
    ]
}

