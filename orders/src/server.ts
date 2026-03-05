import { createServer } from "http";
import app from "./app";

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3002;
const SERVER_NAME = process.env.SERVER_NAME || "orders-service";

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});