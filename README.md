# 🔒 Link Lock V2 - Pippo Edition

A secure, client-side URL encryption tool with password protection. Encrypt any URL with a fixed password and share it safely.

---

## ✨ Features

- **🔐 Password Protection** - Protect your URLs with a fixed decryption password (`pippo`)
- **🔒 Admin Panel** - Create encrypted links with a secure admin interface
- **📱 User-Friendly Decryption** - Simple interface for users to decrypt and access protected links
- **🎨 Modern UI** - Clean, dark-themed design with smooth animations
- **🛡️ Anti-Developer Tools** - Protects against F12, right-click, and developer console access
- **⚡ Fast & Lightweight** - Pure client-side JavaScript, no server needed
- **🔀 Compact Links** - Optimized payload for shorter encrypted links
- **📋 Copy & QR Code** - Easy sharing with copy-to-clipboard and QR code generation
- **⏰ Expiration Support** - Optional link expiration dates
- **🔀 Advanced Options** - Random IV and salt for enhanced security

---

## 🚀 How It Works

### Decryption Page (`decrypt-public.html`)
1. User opens the encrypted link
2. Enters the decryption password (`pippo`)
3. Link is decrypted and user is redirected after 5 seconds
4. Preview name (e.g., `Viki`, `Akia`) is shown for recognized domains
