import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendMail({ to, subject, text }: { to: string; subject: string; text: string }) {
  return await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  })
}
