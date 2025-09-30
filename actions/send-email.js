import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "");
export async function sendEmail({ to, subject, react }) {
  try {
    const data = await resend.emails.send({
      from: "FinXpert <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    return { success: true, data: data };
  } catch (e) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

// function.js – Triggering the email
// await sendEmail({
//   to: budget.user.email,
//   subject: `Budget Alert for ${defaultAccount.name}`,
//   react: EmailTemplate({
//     userName: budget.user.name,
//     type: "budget-alert",
//     data: {
//       percentageUsed: percentageUsed,
//       budgetAmount: parseInt(budgetAmount).toFixed(1),
//       totalExpenses: parseInt(totalExpenses).toFixed(1),
//     },
//   }),
// });

// What happens here:

// Recipient: to is set to the user’s email (budget.user.email).

// Subject: Dynamic subject: "Budget Alert for Account Name".

// Email Body:

// react: EmailTemplate(...) → you are calling your EmailTemplate React component with props: userName, type, and data.

// EmailTemplate returns a React element (JSX).

// This JSX will be rendered later into HTML before sending.

// send-email.js – Sending the email

// What happens here:

// The function receives to, subject, and react.

// It uses the Resend email service (resend.emails.send) to send the email.

// from: sender address.

// to: recipient email.

// subject: email subject line.

// react: JSX element (your React email template).

// Resend internally renders the JSX to HTML suitable for email.

// If successful, it returns { success: true, data }.

// If it fails, it catches the error and logs it.

// 3️⃣ template.jsx – The email template
// How it works:

// Receives props: userName, type, data.

// Depending on type, it renders different email templates.

// Returns a JSX element (<Html>...</Html>) representing the email body.

// This JSX is later converted to HTML by resend when sending the email.
