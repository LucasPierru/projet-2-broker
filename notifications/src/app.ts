import express from "express";
import cors from "cors";
import api from "./routes/api";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/v1", api);

export default app;