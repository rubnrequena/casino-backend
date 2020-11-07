module.exports = {
  apps: [
    {
      name: "caribe",
      script: "bin/www",
      watch: false,
      ignore_watch: ["node_modules", "tests"],
      instances: 4,
      exec_mode: "cluster",
    },
  ],
};
