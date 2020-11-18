module.exports = {
  apps: [
    {
      name: "caribe",
      script: "bin/www",
      watch: false,
      ignore_watch: ["node_modules", "tests"],
      instances: 4,
      exec_mode: "cluster",
      env: {
        PORT: 3000,
        NODE_ENV: "development",
      },
      env_production: {
        PORT: 443,
        NODE_ENV: "production",
      },
    },
  ],
};
