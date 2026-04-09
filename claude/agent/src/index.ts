import dotenv from "dotenv";

dotenv.config();

console.log("Agent starting...");

const config = {
  backendUrl: process.env.BACKEND_URL || "http://localhost:3000",
  agentId: process.env.AGENT_ID || "agent-001",
  heartbeatInterval: 5000,
  snapshotInterval: 10000,
};

console.log(`Agent ${config.agentId} configured for ${config.backendUrl}`);
