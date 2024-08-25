import express from "express";
import {
  getCurrentUser,
  getToken,
  login,
  logout,
  resetPassword,
  signUp,
  verifyOtp,
} from "../controllers/user.controller.js";

const app = express.Router();

app.post("/signup", signUp);
app.post("/login", login);
app.post("/otp-verification", verifyOtp);
app.post("/reset-password", resetPassword);
app.get("/me", getCurrentUser);
app.get("/auth-check", getToken);
app.post("/logout", logout);

export default app;
