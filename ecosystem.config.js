module.exports = {
  apps: [
    {
      name: "review-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000", // Change port if needed
      cwd: "/home/ubuntu/review-frontend", // Update this path
      instances: 1, // or 'max' for all CPU cores
      exec_mode: "fork", // or 'cluster' for load-balancing
    },
  ],
};
