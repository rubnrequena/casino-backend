module.exports = {
  apps = [
    {
      name: "caribe",
      script: "bin/www",
      watch: false,
      ignore_watch: ["node_modules", "tests"],
      instances: 2,
      exec_mode: "cluster",
      env: {
        PORT: 4000,
        MONGODB_URI: "mongodb://localhost/fullapuesta",
        MONGODB_URI_DEV: "mongodb://localhost/fullapuesta",
        SMTP_USUARIO:"no-responder@sistemasrq.com",
        SMTP_CLAVE:"srq@s0p0rt3",
        SMTP_HOST:"mail.sistemasrq.com",
        SMTP_PORT:465,
        REDIS_PORT:0,
        NODE_ENV: "development"
      },
      env_production: {
        PORT: 443,
        MONGODB_URI: "mongodb://localhost/fullapuesta",
        MONGODB_URI_DEV: "mongodb://localhost/fullapuesta",
        NODE_ENV: "production",
      }
    },
  ],
};
