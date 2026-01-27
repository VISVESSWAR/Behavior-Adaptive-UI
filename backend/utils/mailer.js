import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter ready");
  }
});

export async function sendOtpEmail(to, otp) {
  try {
    await transporter.sendMail({
      from: `"Account Recovery" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Account Recovery OTP",
      text: `Your OTP is: ${otp}\n\nValid for 5 minutes.`
    });

    console.log("✅ OTP email sent to:", to);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
    throw err;
  }
}
