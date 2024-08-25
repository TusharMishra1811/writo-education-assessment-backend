import mongoose from "mongoose";

interface IUser extends Document {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  isVerified: boolean;
  verifyOtp: number | undefined;
  verifyOtpExpiry: Date | undefined;
}

const schema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please enter First Name"],
  },
  lastName: {
    type: String,
    required: [true, "Please enter Last Name"],
  },
  password: {
    type: String,
    required: [true, "Please enter password"],
  },
  email: {
    type: String,
    unique: [true, "Email already exist"],
    required: [true, "Please enter email"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifyOtp: {
    type: Number,
  },
  verifyOtpExpiry: {
    type: String,
  },
});

export const User = mongoose.model<IUser>("User", schema);
