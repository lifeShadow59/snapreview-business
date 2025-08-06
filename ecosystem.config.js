module.exports = {
  apps: [
    {
      name: "snapreview-business",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001", // Change port if needed
      cwd: "/home/ubuntu/snapreview-business", // Update this path
      instances: 1, // or 'max' for all CPU cores
      exec_mode: "fork", // or 'cluster' for load-balancing
    },
  ],
};
