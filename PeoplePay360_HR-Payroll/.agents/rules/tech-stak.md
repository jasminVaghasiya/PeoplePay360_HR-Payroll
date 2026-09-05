---
trigger: always_on
---

# Technology Stack Rules

## Purpose

This project uses the following technology stack:

- Frontend: React + HTML + CSS + JavaScript
- Backend: Node.js + Express ecosystem + JavaScript
- Database: MongoDB
- Package Manager: npm

The agent MUST follow these technology choices unless the user explicitly requests a change.

---

# 1. General Rules

## 1.1 Language

- Use **JavaScript only**.
- Do NOT use TypeScript.
- Do NOT create `.ts` or `.tsx` files.
- Use `.js` and `.jsx` files where appropriate.
- Do NOT introduce another programming language unless explicitly required.

## 1.2 Package Manager

- Use **npm only**.
- Do NOT use Yarn.
- Do NOT use pnpm.
- Do NOT use Bun.
- Do NOT create or modify `yarn.lock`.
- Do NOT create or modify `pnpm-lock.yaml`.
- Do NOT create or modify `bun.lock` or `bun.lockb`.
- Use `package-lock.json` for dependency locking.

Preferred commands:

```bash
npm install
npm install <package>
npm install -D <package>
npm uninstall <package>
npm run <script>
npm test