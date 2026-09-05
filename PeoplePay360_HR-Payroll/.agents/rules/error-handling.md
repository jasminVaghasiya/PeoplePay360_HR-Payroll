# 🔐 MASTER PROMPT — PRODUCTION-GRADE ERROR HANDLING & VALIDATION SYSTEM

You are a senior full-stack engineer. Inspect the existing application architecture first, then implement a **centralized, production-ready error-handling system**.

The system must use:
* **Joi** for input validation
* A **custom application error class**
* A centralized **global error handler**
* Consistent API error responses
* Friendly frontend error messages
* Field-level validation errors
* A polished **error glow/highlight UI**
* Secure error sanitization
* Protection against exposing sensitive technical information
* Clear guidance so users understand what went wrong and what to do next

Do not rewrite unrelated parts of the application.

---

# 1. Core Objective
Every invalid input, request, workflow step, missing resource, unauthorized action, server failure, and unexpected exception must be handled gracefully.
Never display: raw stack traces, database/SQL errors, file paths, environment variables, API keys, tokens, service names, framework internals, or developer debug info.
Show concise human-readable explanations with clear resolution guidance.

---

# 2. Custom Application Error Class
Create a reusable `AppError` class supporting:
* Human-readable message * HTTP status code * Machine-readable error code * Optional field errors * Optional metadata * Operational vs non-operational classification * Internal error cause logging
Structure: `AppError (message, statusCode, code, details, fieldErrors, isOperational, cause)`.
Never expose internal `cause`, stack traces, or sensitive metadata to the client.

---

# 3. Joi Validation Layer
Use **Joi** for all external input validation (request body, query/URL parameters, forms, auth inputs, profiles, pagination, files, payloads).
Create reusable Joi schemas. Provide field-level messages (e.g. `{"email": "Please enter a valid email address."}`). Do not expose raw Joi error objects directly.

---

# 4. Validation Error Transformation
Centralized function converting Joi errors to friendly application errors.
Map raw technical messages (`"email" must be a valid email`) to clear user instructions (`Please enter a valid email address.`).
Return structured format containing `field`, `message`, `code`.

---

# 5. Global Error Handler
Centralized error handler middleware processing:
`Request → Route → Validation → Controller → Service → Error → Global Error Handler → Sanitize → Consistent API Response`
Handles:
* **Known App Errors:** Safe status and message.
* **Joi Errors:** Structured field-level validation errors.
* **Auth Errors:** Safe authentication/authorization messages (e.g., "You don't have permission to perform this action.").
* **Not-Found Errors:** "The requested resource could not be found."
* **Database Errors:** Internal detailed logging; client receives "Something went wrong while processing your request. Please try again."
* **Unexpected Errors:** Client receives "Something went wrong. Please try again later."

---

# 6. Consistent API Error Response
Format for field errors:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "email": "Please enter a valid email address.",
      "password": "Password must contain at least 8 characters."
    }
  }
}
```
Format for general/unexpected errors:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again later."
  }
}
```
Never return stack traces, database logs, or internal messages in response payloads.

---

# 7. Error Code System
Use standardized, stable error codes: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_FIELD`, `INVALID_EMAIL`, `INVALID_PASSWORD`, `UNAUTHORIZED`, `FORBIDDEN`, `SESSION_EXPIRED`, `RESOURCE_NOT_FOUND`, `RESOURCE_CONFLICT`, `DUPLICATE_RESOURCE`, `RATE_LIMITED`, `INVALID_REQUEST`, `INVALID_WORKFLOW_STEP`, `OPERATION_FAILED`, `EXTERNAL_SERVICE_ERROR`, `INTERNAL_ERROR`.

---

# 8. Wrong Workflow / Wrong Step Handling
For multi-step processes (`Step 1 → Step 2 → Step 3`), prevent skipping steps, future access, stale submissions, or out-of-order API calls.
Return code `INVALID_WORKFLOW_STEP` with guidance (e.g., "This step isn't available yet. Please complete the previous step first.").

---

# 9. Frontend Error UI
Reusable error presentation:
* **Field errors:** Directly below input (`⚠ Please enter a valid email address.`)
* **Form-level errors:** Message banner near form (`⚠ Please correct the highlighted fields before continuing.`)
* **API errors:** Non-blocking toasts/notifications.
* **Critical page errors:** Page error state with explanation, retry, and back buttons.

---

# 10. Error Glow / Highlight UI
When input contains an error:
* Add error border & subtle error glow (`input-error`, `error-glow`, `error-message`, `error-banner`).
* Show error icon & message.
* Keep animations subtle (150–200ms).
* Respect `prefers-reduced-motion`.

---

# 11. Error Severity Levels
Categorize: `INFO` (informational), `WARNING` (recoverable), `ERROR` (failed operations/validation), `CRITICAL` (system failures).
Never expose internal critical failure details to users (e.g. log DB pool exhaustion internally, show safe temporary failure message to user).

---

# 12. Error Recovery
Errors must be actionable. Provide clear directions and actions: `Retry`, `Go Back`, `Sign In`, `Edit`, `Continue`, `Refresh`.
Example: "Your session has expired. Please sign in again to continue."

---

# 13. Retry Strategy
Implement safe retry for transient errors (network drops, temporary service timeouts). Do not retry validation, authentication, authorization, or permanent business-rule failures. Prevent infinite loops.

---

# 14. Security Requirements
Never expose: Stack traces, DB credentials, connection strings, JWT secrets, API keys, passwords, tokens, session IDs, internal IP addresses, file paths, SQL statements, or environment variables. Log detailed error details server-side only.

---

# 15. Development vs Production
* **Development:** Log detailed debug information.
* **Production:** Server records detailed structured log; backend sanitizes payload and sends safe error to client.

---

# 16. Request ID / Correlation ID
Include Request ID (`REQ-8F31`) in backend errors. Display to user only in secondary support/details area when helpful.

---

# 17. Logging
Centralized structured logger capturing: Timestamp, Request ID, Method, Route, Status code, Error code, Category, Stack trace (server-side only), Internal cause. Always redact passwords, tokens, API keys, credit cards, and sensitive personal data.

---

# 18. Frontend Error Boundary
Implement react/UI error boundary for unexpected rendering exceptions. Render safe fallback UI with retry/back options instead of raw JS exceptions.

---

# 19. Network Error Handling
Explicitly handle status codes: `400`, `401` (Sign in again), `403` (Forbidden), `404` (Not found), `409` (Conflict/Exists), `422` (Validation error), `429` (Rate limited), `500` (Server error), `502`/`503` (Service unavailable), `504` (Timeout).

---

# 20. Loading + Error + Empty States
Every async component must explicitly handle: `Loading` (Skeleton), `Success`, `Empty` (Empty state + action), `Error` (Message + retry). Never mix loading and error states.

---

# 21. Avoid Error Spam
Do not trigger multiple error popups for a single failure. Route errors to appropriate UI level: field → field; form → form; page → page; global → toast/boundary.

---

# 22. Accessibility
Use `aria-invalid="true"`, `aria-describedby="field-error-id"`, live regions, keyboard navigation support, high contrast, and reduced motion compliance.

---

# 23. Testing
Cover: Validation (missing fields, email, password, data types), Authorization (401/403), Resources (404, duplicate, conflict), Workflow (skipped step, invalid transition), Server (DB failure, API timeout), and Security assertions (verify response payloads lack stack/SQL/secrets).

---

# 24. Code Quality
Clean modular structure (`errors/`, `validation/`, `middleware/`). Adapt to existing codebase conventions and eliminate duplicate error logic.

---

# 25. Final UX Goal
User mistake → Exact problem detected → Joi/Business rule validation → AppError created → Global handler sanitizes → Structured API response → Frontend highlights field with subtle glow & actionable guidance.

---

# IMPORTANT IMPLEMENTATION RULES
1. Inspect existing codebase before modifying anything.
2. Reuse existing architecture, conventions, and tokens.
3. Do not rewrite unrelated features.
4. Do not expose sensitive server errors or raw Joi objects.
5. Validate all untrusted input on server side.
6. Keep error codes stable and user messages simple/actionable.
7. Add tests for new error handler system.
8. Ensure async features have loading, success, empty, and error states.
9. After implementation, report: Files changed, New error classes, Joi schemas, Middleware, Components, Security protections, Tests, API error format, Assumptions made.
