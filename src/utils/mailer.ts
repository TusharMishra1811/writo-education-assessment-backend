import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { User } from "../models/user.model.js";

export const sendMail = async ({ email, userId }: any) => {
  try {
    const otp = Math.floor(Math.random() * (10000 - 1000) + 1000);

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          verifyOtp: otp,
          verifyOtpExpiry: Date.now() + 3600000,
        },
      },
      { new: true }
    );

    const transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> =
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT!, 10),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      } as SMTPTransport.Options);

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Verify Email",
      html: `<p>The otp for verification is : ${otp}</p>`,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
