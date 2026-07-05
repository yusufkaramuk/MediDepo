# Security Policy

## Supported Versions

Only the latest deployed version of DrDepo is actively maintained. Older releases are **not** patched.

| Version | Supported          |
| ------- | ------------------ |
| Latest (main branch) | ✅ |
| Older releases | ❌ |

---

## Reporting a Vulnerability

> [!IMPORTANT]
> **Please do NOT open a public GitHub issue for security vulnerabilities.** Public disclosure before a fix is in place could put users at risk.

### How to Report

Send a detailed report to **[GitHub Private Security Advisory](https://github.com/yusufkaramuk/DrDepo/security/advisories/new)** or, if that is unavailable, reach out via a private GitHub message.

### What to Include

A good vulnerability report should contain:

- **Description** — A clear explanation of the vulnerability and its impact.
- **Affected component** — Which file, function, or service is affected (e.g., `ShareLinkCrypto.js`, Firestore rules, `AuthModal.jsx`).
- **Steps to reproduce** — A minimal proof-of-concept or step-by-step instructions.
- **Expected vs. actual behavior** — What should happen vs. what does happen.
- **Potential impact** — Who is affected and how severely (data leak, account takeover, etc.).
- **Suggested fix** (optional but appreciated).

### Response Timeline

| Stage | Target |
| ----- | ------ |
| Acknowledgement | Within **72 hours** |
| Assessment complete | Within **7 days** |
| Fix released | Within **14 days** (critical), **30 days** (moderate) |

---

## Security Architecture

This project implements several layers of defence to protect user data:

### Client-Side Encryption (AES-256-GCM)
Sensitive medicine fields (`name`, `activeIngredient*`, `notes`) are encrypted in the browser using the **Web Crypto API (AES-256-GCM)** before being written to Firestore. The encryption key is derived from the user's passphrase and never leaves the device in plaintext.

### Shared Link Encryption
When a user creates a share link, the medicine payload is encrypted with a per-link AES-256-GCM key derived via **HKDF** from a random 16-byte token. The decryption key travels only in the **URL `#fragment`**, which is never sent to the server in HTTP logs.

### Firebase Security Rules
Firestore and Firebase Storage are protected by strict security rules:
- Users can only read and write their **own** documents.
- QR/invite joins use transaction-safe rules (`validQrSelfJoin`).
- All write operations validate data shape and field types server-side.

### Authentication
- Firebase Authentication with e-mail/password and Google Sign-In.
- E-mail verification required before full access.
- Password reset rate-limited on the client side (`AUTH_COOLDOWN_MS`).

---

## Scope

The following are **in scope** for vulnerability reports:

- Firestore security rule bypasses (unauthorized read/write of another user's data)
- Authentication or session vulnerabilities
- Client-side encryption weaknesses (key exposure, IV reuse, algorithm downgrade)
- Cross-Site Scripting (XSS) leading to data exfiltration
- Insecure share link handling

The following are **out of scope**:

- Vulnerabilities in third-party services (Firebase, Google) — report those directly to Google.
- Issues that require physical access to the victim's device.
- `npm audit` findings in **dev-only** dependencies (e.g., Vite, Babel) that do not affect the production bundle.
- Social engineering attacks.

---

## Disclosure Policy

This project follows **coordinated (responsible) disclosure**:

1. Reporter sends a private report.
2. Maintainer acknowledges and investigates.
3. A fix is developed and released.
4. The vulnerability is disclosed publicly **after** the fix is live, with credit given to the reporter (unless anonymity is requested).

---

*This security policy was last updated: June 2026*
