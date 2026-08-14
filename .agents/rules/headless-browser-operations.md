# Headless Browser Operations & Disk Safety on Restricted VMs

This rule governs behavior when managing, troubleshooting, or deploying backend scripts that run headless browser sessions (e.g., Puppeteer, Playwright, Camoufox) on virtual machines with constrained resource limits.

## 1. Preventing Core Dump Bloat
- **Check Crash Daemons:** On VM environments (like Hetzner, DigitalOcean), if a "Disk Full" or "No space left on device" error occurs, immediately check for core dump files (e.g., in `/var/lib/apport/coredump/` or `/var/lib/systemd/coredump/`).
- **Disable Apport/Crash Reporting:** If headless browsers crash frequently or leak RAM, prevent giant virtual memory dumps by stopping and disabling the crash reporter service:
  ```bash
  systemctl stop apport.service
  systemctl disable apport.service
  ```
- **Set Limits:** Use `ulimit -c 0` in shell sessions or systemd unit definitions to block any native core dump generation by Chrome or Node.

## 2. Headless Browser Memory Management
- **Safe Closing:** All browser launches and page routes must run inside try-catch-finally structures where the browser instance is explicitly closed in the `finally` block (`await browser.close()`).
- **Media Blocking:** To conserve network bandwidth and prevent browser instances from caching too much data, block media types (images, stylesheets, fonts) on all headless requests unless specifically required for screenshots.

## 3. Post-Disk-Full Deployment Integrity
- **Validate File Size:** If deploying static frontend assets (Vite/React build dist) immediately after a server disk-full recovery, always check the file sizes of the extracted output (e.g. `ls -lh /var/www/...`). 
- **Incomplete Extraction Check:** Extractor tools like `tar -xzf` or `unzip` fail silently or partially when disk space is exhausted, resulting in truncated JS bundles or 0-byte CSS files. Never assume a deployment succeeded just because the command finished without throwing an explicit error.
