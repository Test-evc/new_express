import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import router from "./mainRoute.js";
import cors from "cors";

dotenv.config({ path: ".env" });

const app = express();

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/api", router);
app.get("/health", (_, res) => {
  res.json({
    message: "working",
  });
});

app.listen(PORT, () => {
  console.log(`Server started successfully on port ${PORT}`);
});
