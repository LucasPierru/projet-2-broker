import { createServer } from "http";
import app from "./app";

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3006;
const SERVER_NAME = process.env.SERVER_NAME || "catalog-service";

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});