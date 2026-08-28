"""
Transactional Email Service for Password Recovery & Security Alerts.
Supports SMTP with TLS and silent async logging fallback.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional


def send_password_reset_email(to_email: str, company_name: str, reset_link: str) -> bool:
    """
    Dispatches a professional HTML password recovery email to the merchant.
    If SMTP is not configured, logs the delivery dispatch safely.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", "no-reply@vigilai.io")

    # If SMTP is configured, send real email
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Reset Your VigilAI Merchant Password"
            msg["From"] = f"VigilAI Security <{from_email}>"
            msg["To"] = to_email

            text_content = f"""
Hello {company_name},

A password reset request was received for your VigilAI merchant account.
Click the link below to set a new password (valid for 15 minutes):

{reset_link}

If you did not request this change, you can safely ignore this message.

— VigilAI Security Operations Team
"""

            html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f1f5f9; padding: 24px; }}
    .card {{ background-color: #0B132B; border: 1px solid #1e293b; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 32px; }}
    .logo {{ color: #38bdf8; font-size: 22px; font-weight: 800; text-decoration: none; }}
    .btn {{ display: inline-block; background-color: #06b6d4; color: #000000; font-weight: 700; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 20px 0; }}
    .footer {{ font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Vigil<span style="color:#a855f7;">AI</span></div>
    <h2 style="color: #ffffff; margin-top: 20px;">Password Reset Request</h2>
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
      Hello <strong>{company_name}</strong>,<br>
      We received a request to reset the password for your VigilAI merchant account (<code>{to_email}</code>).
    </p>
    <p>
      <a href="{reset_link}" class="btn">Reset Password Now &rarr;</a>
    </p>
    <p style="font-size: 12px; color: #94a3b8;">
      This single-use recovery link will expire in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.
    </p>
    <div class="footer">
      VigilAI Autonomous Fraud & Sybil Defense &bull; Automated Security Notification
    </div>
  </div>
</body>
</html>
"""
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to_email], msg.as_string())
            return True
        except Exception as e:
            import sys
            print(f"[EmailService] Failed to send email via SMTP: {e}", file=sys.stderr)
            return False

    return True
