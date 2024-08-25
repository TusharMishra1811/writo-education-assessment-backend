import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { sendMail } from "../utils/mailer.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/utils-class.js";

interface SignupBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const signUp = async (
  req: Request<{}, {}, SignupBody>,
  res: Response,
  next: NextFunction
) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return next(new ErrorHandler("Please provide all the fields", 400));
  }

  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("User already exists", 400));
  }

  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password and confirm password should be same", 401)
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPasword = await bcrypt.hash(password, salt);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPasword,
  });

  await newUser.save();

  await sendMail({ email, userId: newUser._id });

  const tokenData = {
    id: newUser._id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
  };

  const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
    expiresIn: "1d",
  });

  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "user is created successfully",
    newUser,
  });
};

interface VerifyOtpBody {
  verifyOtp: number;
}

export const verifyOtp = async (
  req: Request<{}, {}, VerifyOtpBody>,
  res: Response,
  next: NextFunction
) => {
  const { verifyOtp } = req.body;

  if (!verifyOtp) {
    return next(new ErrorHandler("Please provide the otp", 401));
  }

  const user = await User.findOne({
    verifyOtp,
    verifyOtpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid OTP", 401));
  }

  user.isVerified = true;
  user.verifyOtp = undefined;
  user.verifyOtpExpiry = undefined;

  await user.save();

  return res
    .status(200)
    .json({ success: true, message: "Email is verified successfully." });
};

interface LoginBody {
  email: string;
  password: string;
}

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide all the fields", 401));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User is not registered", 400));
  }

  const isMatched = await bcrypt.compare(password, user.password);

  if (!isMatched) {
    return next(new ErrorHandler("Invalid email or password", 404));
  }

  const tokenData = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };

  const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, {
    expiresIn: "1d",
  });

  res.cookie("authToken", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "strict",
  });

  return res
    .status(200)
    .json({ message: "user is logged in successfully", success: true, user });
};

interface ResetPasswordBody {
  oldPassword: string;
  newPassword: string;
}

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordBody>,
  res: Response,
  next: NextFunction
) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please provide all the fields", 400));
  }

  const token = req.cookies.authToken;

  if (!token) {
    return next(new ErrorHandler("Authentication token is not found", 404));
  }

  const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!);
  const email = decoded.email;

  if (!email) {
    return next(new ErrorHandler("User not found", 404));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isMatched = await bcrypt.compare(oldPassword, user.password);

  if (!isMatched) {
    return next(new ErrorHandler("Invalid Password", 401));
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedNewPassword;
  await user.save();

  return res
    .status(200)
    .json({ message: "Password updated successfully", success: true });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "User logged out successfully",
    success: true,
  });
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.authToken;

  if (!token) {
    return next(new ErrorHandler("authentication token is missing", 404));
  }

  const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!);
  const firstName = decoded.firstName;

  return res.status(200).json({
    success: true,
    firstName,
    message: "User is fetched successfully",
  });
};

export const getToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.authToken;
  if (!token) {
    return next(new ErrorHandler("authentication token is missing", 404));
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
    return res.json({ isAuthenticated: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ isAuthenticated: false });
  }
};
//todo: error handler
