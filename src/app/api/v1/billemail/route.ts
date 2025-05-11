import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { to, subject, orderId, tableNumber, totalAmount, items } = await request.json()

    // Validate email
    if (!to || !to.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Create a transporter using the provided email credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Format the items table
    const itemsTable = items && items.length > 0 
      ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="border-bottom: 1px solid #eaeaea;">
              <th style="text-align: left; padding: 8px;">Item</th>
              <th style="text-align: center; padding: 8px;">Qty</th>
              <th style="text-align: right; padding: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: { name: string; quantity: number; price: number }) => `
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="text-align: left; padding: 8px;">${item.name}</td>
                <td style="text-align: center; padding: 8px;">${item.quantity || 1}</td>
                <td style="text-align: right; padding: 8px;">₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p>No items in this order.</p>';

    // Calculate GST
    const subtotal = items && items.length > 0 
      ? items.reduce((sum: number, item: { name: string; quantity: number; price: number }) => sum + (item.price || 0) * (item.quantity || 1), 0)
      : 0;
    const gstAmount = subtotal * 0.05;
    const gstPerHalf = gstAmount / 2;

    // Create a comprehensive email body with all order details
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="biteandco.png" alt="Restaurant Logo" style="width: 150px; height: auto;" />
          <div style="color: #666; font-size: 14px;">
            <p>Contact: +91 9874563210</p>
            <p>Address: Belgavi</p>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">
          BILL RECEIPT
        </div>
        
        <div style="margin-bottom: 20px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Order #:</span>
            <span>${orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Table:</span>
            <span>${tableNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Date:</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Time:</span>
            <span>${new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 15px;">
          <p style="font-weight: bold; margin-bottom: 10px;">Order Summary</p>
          ${itemsTable}
        </div>
        
        <div style="margin-bottom: 15px; font-size: 14px; text-align: right;">
          <div style="margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span style="margin-left: 10px;">₹${subtotal.toFixed(2)}</span>
          </div>
          <div style="margin-bottom: 5px;">
            <span>CGST (2.5%):</span>
            <span style="margin-left: 10px;">₹${gstPerHalf.toFixed(2)}</span>
          </div>
          <div style="margin-bottom: 5px;">
            <span>SGST (2.5%):</span>
            <span style="margin-left: 10px;">₹${gstPerHalf.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="font-weight: bold; display: flex; justify-content: space-between; font-size: 16px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eaeaea;">
          <span>Total Amount:</span>
          <span style="color: #f59e0b;">₹${totalAmount.toFixed(2)}</span>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>Thank you for dining with us!</p>
          <p>Visit again soon!</p>
        </div>
      </div>
    `

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: emailBody,
      // No attachments anymore, everything is in the email body
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
