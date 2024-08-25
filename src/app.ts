import express from "express";
import { connectDb } from "./db/db.js";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGO_URI || "";

connectDb(mongoUri);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.CLIENT_URL!],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("api is working");
});

app.use("/api/v1/user", userRoute);



app.use(errorMiddleware);




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
