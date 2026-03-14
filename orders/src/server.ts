import { createServer } from "http";
import path from "path";
const moduleAlias = require("module-alias");

moduleAlias.addAliases({
  "@constants":
    process.env.CONSTANTS_PATH || path.resolve(__dirname, "../../../constants"),
  "@db": process.env.DB_PATH || path.resolve(__dirname, "../../../db"),
});

const app = require("./app").default;

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3002;
const SERVER_NAME = process.env.SERVER_NAME || "orders-service";

server.listen(PORT, () => {
  console.log(`${SERVER_NAME} running on port ${PORT}`);
});