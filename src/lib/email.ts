import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: 'LASC Field Scheduler <onboarding@resend.dev>',
    to: email,
    subject: 'Reset Your Password - LASC Field Scheduler',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
            .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(to right, #16a34a, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚽ LASC Field Scheduler</div>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hi ${name || 'there'},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>LASC Field Scheduler</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendReservationConfirmationEmail(
  email: string, 
  name: string, 
  fieldName: string, 
  zoneName: string, 
  date: string, 
  startTime: string, 
  endTime: string
) {
  // Format date and time nicely
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  await resend.emails.send({
    from: 'LASC Field Scheduler <onboarding@resend.dev>',
    to: email,
    subject: `Reservation Confirmed - ${fieldName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
            .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0; }
            .details { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚽ LASC Field Scheduler</div>
            </div>
            <div class="content">
              <h2 style="color: #16a34a;">✓ Reservation Confirmed!</h2>
              <p>Hi ${name},</p>
              <p>Your field reservation has been confirmed. Here are your booking details:</p>
              <div class="details">
                <div class="detail-row">
                  <span class="label">Field</span>
                  <span class="value">${fieldName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Zone</span>
                  <span class="value">${zoneName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date</span>
                  <span class="value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time</span>
                  <span class="value">${formatTime(startTime)} - ${formatTime(endTime)}</span>
                </div>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Please arrive on time. If you need to cancel, please do so at least 24 hours in advance.</p>
            </div>
            <div class="footer">
              <p>LASC Field Scheduler</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}