# 🔐 Security Policy — PatchPilot

## 🧭 Overview

PatchPilot is a **locally-run, offline-first** AI code reviewer. It is designed with privacy and local security in mind.

- No cloud API calls
- No telemetry or analytics
- No automatic file uploading
- All AI processing is done **on your device**

---

## 🛡️ Security Goals

- Keep your code **private and local**
- Prevent unauthorized code execution
- Avoid dependencies that phone home
- Ensure sandboxing and timeout control for all execution environments

---

## 🧪 Code Execution Safety

PatchPilot includes features to **run user code in a sandbox**. It uses `subprocess`, timeouts, and language-specific runners.

If you're modifying this tool, please ensure:

- User code runs in a **safe and isolated subprocess**
- Dangerous functions like `eval()` or unrestricted I/O are **not used**
- Execution timeout is enforced to prevent infinite loops

---

## 🧠 AI Processing

PatchPilot uses [Ollama](https://ollama.com), which runs an LLM **entirely on your machine**. No data leaves your device unless you:
- Manually send files elsewhere
- Modify the app to include network behavior (not supported or recommended)

---

## 📂 File Permissions

PatchPilot only accesses files you **explicitly select or drop** into the UI. It does not auto-scan or index your system.

---

## 🐛 Reporting Vulnerabilities

If you discover a security vulnerability in PatchPilot, **please report it privately** to the project maintainer.

### 📧 Contact:

EJ Quigley
[GitHub](https://github.com/Coropos-Web-Services)
Email: [equigley@coroposws.com](mailto:equigley@coroposws.com)


Please do **not** open public issues for security flaws. Disclose them privately to allow time for a proper fix.

---

## 🚫 Forbidden Actions by Users

Under the license, users may **not**:
- Distribute modified copies that include telemetry or tracking
- Add or enable networking in a way that violates the offline-only intent
- Use PatchPilot to analyze or run untrusted code from others

---

## 🔄 License and Security Updates

This project reserves the right to **update its security model and license terms** in future releases. Changes will be documented in `CHANGELOG.md` and reflected here.

---

## ✅ Keep it safe. Keep it local.  
PatchPilot is built for you — let’s keep it secure together.

## Updates
This policy may be updated. With continued use you understand the changes and accept them.
