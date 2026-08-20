package email

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"devflow/internal/config"
)

// Mailer defines the contract for sending transactional emails.
type Mailer interface {
	SendPasswordResetEmail(toEmail, username, resetLink string) error
	IsConfigured() bool
}

// ResendMailer sends emails using the Resend REST API.
type ResendMailer struct {
	apiKey     string
	from       string
	httpClient *http.Client
}

func NewResendMailer(apiKey, from string) *ResendMailer {
	return &ResendMailer{
		apiKey: apiKey,
		from:   from,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (m *ResendMailer) IsConfigured() bool {
	return m.apiKey != ""
}

func (m *ResendMailer) SendPasswordResetEmail(toEmail, username, resetLink string) error {
	subject := "Reset your DevFlow password"
	htmlBody := renderPasswordResetHTML(username, resetLink)
	textBody := renderPasswordResetText(username, resetLink)

	payload := map[string]interface{}{
		"from":    m.from,
		"to":      []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
		"text":    textBody,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create resend request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call resend api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var resendErr struct {
			Message string `json:"message"`
			Name    string `json:"name"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&resendErr)
		return fmt.Errorf("resend api error (status %d): %s", resp.StatusCode, resendErr.Message)
	}

	log.Printf("📧 Password reset email sent via Resend to %s", toEmail)
	return nil
}

// SMTPMailer sends emails via standard SMTP server.
type SMTPMailer struct {
	host               string
	port               int
	user               string
	password           string
	from               string
	insecureSkipVerify bool
}

func NewSMTPMailer(host string, port int, user, password, from string, insecureSkipVerify bool) *SMTPMailer {
	return &SMTPMailer{
		host:               host,
		port:               port,
		user:               user,
		password:           password,
		from:               from,
		insecureSkipVerify: insecureSkipVerify,
	}
}

func (m *SMTPMailer) IsConfigured() bool {
	return m.host != ""
}

func (m *SMTPMailer) SendPasswordResetEmail(toEmail, username, resetLink string) error {
	subject := "Reset your DevFlow password"
	htmlBody := renderPasswordResetHTML(username, resetLink)
	textBody := renderPasswordResetText(username, resetLink)

	boundary := "devflow_boundary_separator"
	headers := make(map[string]string)
	headers["From"] = m.from
	headers["To"] = toEmail
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = fmt.Sprintf("multipart/alternative; boundary=%s", boundary)

	var msg bytes.Buffer
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")

	// Plain text part
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 7bit\r\n\r\n")
	msg.WriteString(textBody)
	msg.WriteString("\r\n\r\n")

	// HTML part
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 7bit\r\n\r\n")
	msg.WriteString(htmlBody)
	msg.WriteString("\r\n\r\n")

	msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	addr := fmt.Sprintf("%s:%d", m.host, m.port)

	// SSL on port 465
	if m.port == 465 {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: m.insecureSkipVerify,
			ServerName:         m.host,
		}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("failed to dial SMTP TLS on port 465: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, m.host)
		if err != nil {
			return fmt.Errorf("failed to create SMTP client: %w", err)
		}
		defer client.Quit()

		if m.user != "" && m.password != "" {
			auth := smtp.PlainAuth("", m.user, m.password, m.host)
			if err := client.Auth(auth); err != nil {
				return fmt.Errorf("failed SMTP authentication: %w", err)
			}
		}

		if err := client.Mail(extractEmail(m.from)); err != nil {
			return err
		}
		if err := client.Rcpt(toEmail); err != nil {
			return err
		}
		w, err := client.Data()
		if err != nil {
			return err
		}
		if _, err := w.Write(msg.Bytes()); err != nil {
			return err
		}
		if err := w.Close(); err != nil {
			return err
		}
	} else {
		// STARTTLS on port 587 or plain port 25
		var auth smtp.Auth
		if m.user != "" && m.password != "" {
			auth = smtp.PlainAuth("", m.user, m.password, m.host)
		}

		// Connect to server
		conn, err := net.DialTimeout("tcp", addr, 10*time.Second)
		if err != nil {
			return fmt.Errorf("failed to connect to SMTP server %s: %w", addr, err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, m.host)
		if err != nil {
			return fmt.Errorf("failed to initialize SMTP client: %w", err)
		}
		defer client.Quit()

		// Try STARTTLS if available
		if ok, _ := client.Extension("STARTTLS"); ok {
			tlsConfig := &tls.Config{
				InsecureSkipVerify: m.insecureSkipVerify,
				ServerName:         m.host,
			}
			if err := client.StartTLS(tlsConfig); err != nil {
				return fmt.Errorf("SMTP StartTLS failed: %w", err)
			}
		}

		if auth != nil {
			if ok, _ := client.Extension("AUTH"); ok {
				if err := client.Auth(auth); err != nil {
					return fmt.Errorf("SMTP auth failed: %w", err)
				}
			}
		}

		if err := client.Mail(extractEmail(m.from)); err != nil {
			return err
		}
		if err := client.Rcpt(toEmail); err != nil {
			return err
		}
		w, err := client.Data()
		if err != nil {
			return err
		}
		if _, err := w.Write(msg.Bytes()); err != nil {
			return err
		}
		if err := w.Close(); err != nil {
			return err
		}
	}

	log.Printf("📧 Password reset email sent via SMTP (%s:%d) to %s", m.host, m.port, toEmail)
	return nil
}

// ConsoleMailer logs password reset link directly to the console/log in development mode or when no email provider is configured.
type ConsoleMailer struct{}

func (m *ConsoleMailer) IsConfigured() bool {
	return true
}

func (m *ConsoleMailer) SendPasswordResetEmail(toEmail, username, resetLink string) error {
	log.Printf("\n=======================================================")
	log.Printf("📧 [DEV/CONSOLE MAILER] Password Reset Link for %s (%s):", username, toEmail)
	log.Printf("🔗 Link: %s", resetLink)
	log.Printf("⏱️  Expires in 30 minutes")
	log.Printf("=======================================================\n")
	return nil
}

// NewMailer creates the appropriate Mailer implementation based on Config.
func NewMailer(cfg *config.Config) Mailer {
	if cfg.ResendAPIKey != "" {
		log.Printf("✉️  Email Service: Configured with Resend API (from: %s)", cfg.EmailFrom)
		return NewResendMailer(cfg.ResendAPIKey, cfg.EmailFrom)
	}

	if cfg.SMTPHost != "" {
		log.Printf("✉️  Email Service: Configured with SMTP (%s:%d, from: %s)", cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPFrom)
		return NewSMTPMailer(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom, cfg.SMTPInsecureSkipVerify)
	}

	log.Printf("⚠️  Email Service: No Resend API Key or SMTP Host set. Reset links will be printed to server logs (Console Mailer).")
	return &ConsoleMailer{}
}

func extractEmail(fromHeader string) string {
	if strings.Contains(fromHeader, "<") && strings.Contains(fromHeader, ">") {
		start := strings.Index(fromHeader, "<") + 1
		end := strings.Index(fromHeader, ">")
		if start < end {
			return fromHeader[start:end]
		}
	}
	return strings.TrimSpace(fromHeader)
}

func renderPasswordResetHTML(username, resetLink string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your DevFlow password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d0e; color: #ededed; margin: 0; padding: 24px 0; }
    .container { max-width: 520px; margin: 0 auto; background-color: #141517; border: 1px solid #26272b; border-radius: 12px; padding: 32px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); }
    .logo { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
    h1 { font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.6; color: #9ba1a6; margin: 0 0 20px 0; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #ededed; color: #0c0d0e !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px; }
    .button:hover { background-color: #ffffff; }
    .link-fallback { font-size: 12px; color: #63686e; word-break: break-all; margin-top: 24px; padding-top: 16px; border-top: 1px solid #1c1d21; }
    .footer { font-size: 12px; color: #63686e; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ devflow</div>
    <h1>Password Reset Request</h1>
    <p>Hello <strong>%s</strong>,</p>
    <p>We received a request to reset your password for your DevFlow account. Click the button below to set a new password:</p>
    <div class="button-container">
      <a href="%s" target="_blank" class="button">Reset Password</a>
    </div>
    <p>This password reset link will expire in <strong>30 minutes</strong>.</p>
    <p>If you didn't request a password reset, you can safely ignore this email — your account remains secure.</p>
    <div class="link-fallback">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="%s" style="color: #38bdf8; text-decoration: underline;">%s</a>
    </div>
  </div>
  <div class="footer">
    DevFlow — Personal Developer Knowledge & Prompt Vault
  </div>
</body>
</html>`, username, resetLink, resetLink, resetLink)
}

func renderPasswordResetText(username, resetLink string) string {
	return fmt.Sprintf(`Hello %s,

We received a request to reset your password for your DevFlow account.

Please visit the following link to set a new password:
%s

This link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

— DevFlow Team`, username, resetLink)
}
