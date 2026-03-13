import { createServer } from "http";
import path from "path";

const app = require("./app").default;

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3005;
const SERVER_NAME = process.env.SERVER_NAME || "analytics-service";

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});