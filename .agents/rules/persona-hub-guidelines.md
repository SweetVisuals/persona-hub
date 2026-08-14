# Persona Hub Project Guidelines

These guidelines document key patterns and workflows for working on the Persona Hub codebase.

## 1. Deployment to Hetzner
- When asked to "deploy", "push to Hetzner", or similar, run the local deployment script:
  ```bash
  node worker/deploy_minimal.cjs
  ```
- This script builds the Vite frontend locally and uploads the built assets plus worker files directly to the Hetzner server via SSH (`5.75.252.100`), then restarts the processes with PM2.
- **Do not** rely on generic GitHub deployment workflows or `git push` for Hetzner deployments unless specifically instructed.

## 2. Social Account Reconnections
- When managing or showing social accounts, check their status. Accounts with status `captcha_required` or `error` need manual review / re-authentication.
- To reconnect these accounts, update the `social_accounts` record:
  1. Prompt for/obtain the updated credentials or session cookie.
  2. Update the `session_cookie` column.
  3. Set the `status` column to `pending_login`. This flags the background worker to attempt login again.
