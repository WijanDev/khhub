# API Setup

## Environment Variables

This project uses Cloudflare Workers environment variables. For local development, create a `.dev.vars` file in this directory.

### Setup Instructions

1. Copy the example file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Edit `.dev.vars` and fill in your actual API keys and configuration values.

3. The `.dev.vars` file is gitignored and will not be committed to the repository.

### Required Variables

- `AUTH_SECRET`: A secure random 32-character string for authentication
- `EMAIL_PROVIDER`: One of `'unosend'`, `'mailgun'`, or `'resend'`
- Email API keys (only the one matching your `EMAIL_PROVIDER`):
  - `UNOSEND_API_KEY` (if using Unosend)
  - `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (if using Mailgun)
  - `RESEND_API_KEY` (if using Resend)
- `WEB_APP_URL`: The URL of your web application (e.g., `http://localhost:5173`)

### Production

For production deployments, set these variables in your Cloudflare Workers dashboard or via `wrangler secret put`:

```bash
wrangler secret put AUTH_SECRET
wrangler secret put RESEND_API_KEY
# etc.
```

Or use Cloudflare's dashboard: Workers & Pages → Your Worker → Settings → Variables and Secrets.
