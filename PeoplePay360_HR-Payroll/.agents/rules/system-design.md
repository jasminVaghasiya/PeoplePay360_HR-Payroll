# 🏗️ MASTER PROMPT — COMPLETE SYSTEM DESIGN FOR ANY FEATURE

You are a **Senior Software Architect, Database Architect, Security Engineer, UX Designer, QA Engineer, and Product Engineer**.
I will give you one particular feature/module of my application.
Your job is **NOT to start coding immediately**.
First, deeply understand the feature and create a complete, practical, industry-standard system design in **very easy language**.

The design must cover:
* Normal situations * Invalid situations * Edge cases * Security problems * Permission problems * Workflow problems * Database problems * Failure scenarios * User guidance * Recovery behavior

---

# FEATURE INPUT
**Feature name:** `[FEATURE NAME]`
**Feature description:** `[DESCRIBE THE FEATURE]`
**Application/project:** `[PROJECT NAME]`
**Existing roles:** `[ADMIN / USER / MANAGER / HOD / ETC.]`
**Existing modules:** `[LIST EXISTING MODULES]`
**Technology stack:** `[FRONTEND] + [BACKEND] + [DATABASE]`

---

# IMPORTANT RULE
Do **not** silently assume missing requirements. If something is unclear:
1. Identify ambiguity  2. Give practical assumption  3. Mark as assumption  4. Explain design impact if assumption changes.
Do not redesign unrelated modules. Integrate cleanly with existing code.

---

# 1. FEATURE UNDERSTANDING
Explain in simple words:
* What problem it solves * Who uses it * Why business needs it * Expected result * What happens before/after * Interacting modules.

---

# 2. BUSINESS REQUIREMENTS
Separate into:
* **Functional Requirements:** What system must do (e.g. Create request, Approve/Reject, Track status).
* **Non-Functional Requirements:** Behavior (Secure, Fast, Scalable, Auditable, Accessible, Reliable, Maintainable).

---

# 3. ACTORS / USERS
Identify actors in a table:
| Actor | Who are they? | What can they do? | What can they NOT do? |
| --- | --- | --- | --- |
| User | Employee | Create request | Approve request |
| Manager | Dept Manager | Review requests | System settings |
| Admin | Administrator | Manage system | — |

---

# 4. PERMISSION MATRIX
Chart permissions using: ✅ Allowed | ❌ Not allowed | 👁 View only | 🔄 Conditional
| Action | User | Manager | HOD | Admin |
| --- | ---: | ---: | ---: | ----: |
| Create | ✅ | ✅ | ✅ | ✅ |
| View own | ✅ | ✅ | ✅ | ✅ |
| View all | ❌ | 👁 | 👁 | ✅ |
| Edit / Delete | 🔄 | 🔄 | 🔄 | ✅ |
| Approve | ❌ | ✅ | ✅ | ✅ |
Explain all conditional permissions (e.g. Manager approves only within department).

---

# 5. RBAC + OWNERSHIP RULES
Evaluate security flow:
`Authentication → Role Permission → Org Permission → Resource Ownership → Status → Business Rule → Allow / Reject`
Check Role, Ownership, Org/Dept scope, State validity, and Business logic.

---

# 6. COMPLETE USER WORKFLOW
End-to-end flow:
`User opens feature → Auth check → Permission check → Load data → Render form → User input → Frontend validation → Submit → Backend validation → Business rules → DB Transaction → Create record & Audit log → Send notification → Success response → UI update`

---

# 7. ALTERNATIVE WORKFLOWS
Design non-happy flows:
* **Success:** `User → Request → Validate → Save → Success`
* **Invalid Input:** `Input error → Validation error → User fix`
* **Unauthorized:** `Permission check → Denied`
* **Not Found / Duplicate:** `Lookup fail / Conflict → Safe error / Guidance`
* **Server Failure / Timeout:** `Service fail / Timeout → Rollback → Retry state`
* **Concurrency:** `Concurrent edit → Conflict detection → Prevent silent overwrite`

---

# 8. STATE MACHINE
If applicable, define states (`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → COMPLETED`).
Identify invalid transitions (e.g., `COMPLETED → DRAFT ❌`) and provide transition table:
| Current State | Action | Next State | Allowed Roles |
| --- | --- | --- | --- |
| Draft | Submit | Submitted | User |
| Submitted | Review | Under Review | Manager |
| Under Review | Approve / Reject | Approved / Rejected | Manager |

---

# 9. EDGE CASE ANALYSIS
Cover edge cases: `Problem → Detection → System behavior → User message → Developer log`
* **Input:** Null, Undefined, Long text, Special chars, Duplicates, Extra fields
* **User:** Unauthenticated, Deactivated, Wrong role/dept/org, Expired session
* **Resource:** Missing, Soft-deleted, Belongs to another tenant
* **Network & DB:** Timeouts, Connection loss, Constraints, Deadlocks, Race conditions
* **Security:** ID tampering (`/request/123` to `/124`), Mass assignment, Injection, Broken Auth

---

# 10. DATABASE DESIGN
Define: Tables, Columns, Primary/Foreign keys, Unique constraints, Nullable fields, Defaults, Indexes, Relationships, Status/Audit fields, Soft-deletes.

---

# 11. DATABASE DICTIONARY
Create table spec (e.g., `requests`):
| Column | Type | Required | Default | Description |
| --- | --- | ---: | --- | --- |
| id | UUID | Yes | PK | Unique ID |
| user_id | UUID | Yes | FK | Creator |
| department_id | UUID | Yes | FK | Dept ID |
| title / desc | VARCHAR/TEXT | Yes | — | Request details |
| status | VARCHAR | Yes | DRAFT | Status |
| created_at / updated_at | TIMESTAMP | Yes | NOW | Timestamps |

---

# 12. RELATIONSHIP DESIGN
Diagram relationships (`Company ── Departments ── Users`, `Requests ── (User, Comments, Audit Logs)`). Define 1:1, 1:N, N:M.

---

# 13. DATABASE CONSTRAINTS
Specify DB enforcement (`NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`, `INDEX`). Clarify separation between Frontend, Backend, and DB validation.

---

# 14. INDEXING STRATEGY
Identify frequent queries (user, dept, status). For each: `Index → Target Query → Benefit → Potential Downside`. Avoid redundant indexes.

---

# 15. API DESIGN
Define endpoints (`POST/GET/PATCH/DELETE /api/requests`). Detail: Purpose, Method, URL, Auth, Roles, Body, Params, Validation, Rules, Success & Error responses.

---

# 16. API REQUEST / RESPONSE DESIGN
Provide consistent JSON specs for Success (200/201), Validation (400), Unauthorized (401), Forbidden (403), Not Found (404), Conflict (409), Server Error (500).

---

# 17. VALIDATION DESIGN
Define schemas (e.g. Joi) for inputs. Explain valid/invalid criteria and user errors. Never expose raw internal validation objects.

---

# 18. BUSINESS RULE ENGINE
Format rules clearly:
`RULE-001 | Condition: User must belong to same org as request. Else: Reject FORBIDDEN.`

---

# 19. ERROR-HANDLING DESIGN
Use standard hierarchy (`ValidationError`, `AuthError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`, `InternalError`).
Structure: HTTP Status, Error Code, Safe User Message, Field Errors, Private Log Details. Never expose stack traces or DB details.

---

# 20. USER ERROR GUIDANCE
Ensure errors answer: What happened? Why? What to do next? Avoid opaque codes without guidance.

---

# 21. UI STATES
Define screens for: Loading (Skeleton), Success, Empty (with CTA), Error (with Retry), Unauthorized, Submitting (disable submit + indicator).

---

# 22. FRONTEND COMPONENT DESIGN
Define layout components (e.g., `RequestPage`, `RequestHeader`, `RequestFilters`, `RequestList`, `RequestCard`, `RequestForm`, `StatusBadge`, `ErrorMessage`).

---

# 23. NOTIFICATION DESIGN
Identify triggers (Created, Approved, Rejected, Escalated). Map: `Trigger → Receiver → Channel → Message → Timing`.

---

# 24. AUDIT LOGGING
Audit actions (Create, Update, Approve, Delete, Permission change). Schema: `audit_logs` (`actor_id`, `action`, `entity_type`, `entity_id`, `old_val`, `new_val`, `timestamp`). No secrets in logs.

---

# 25. SECURITY DESIGN
Verify: Authentication, RBAC, Object-Level Authorization (BOLA/ID manipulation), Input Sanitization, Mass Assignment prevention. UI button hiding is NOT security.

---

# 26. TRANSACTION DESIGN
Wrap atomic ops (`Create request + Audit log + Notification`). Define Begin, Execute, Commit, Rollback on failure.

---

# 27. CONCURRENCY
Handle simultaneous actions (e.g. Manager A approves vs Manager B rejects). Implement optimistic locking/versioning. Prevent silent overwrites.

---

# 28. PERFORMANCE
Check N+1 queries, pagination, search indexing, payload size, file upload efficiency.

---

# 29. PAGINATION / SEARCH / FILTER
Define params (`page`, `limit`, `search`, `sort`, `status`, `date_range`). Enforce safe bounds (Default = 20, Max = 100).

---

# 30. FILE UPLOADS
Specify size, type (mime/magic byte validation), storage path, virus scan, download authorization, expiration.

---

# 31. DATA OWNERSHIP
Map role capabilities across View, Create, Edit, Delete, Approve, Reject, Assign, Escalate.

---

# 32. DATA LIFECYCLE
Flow: `Created → Active → Updated → Archived → Deleted`. Define soft vs hard deletes and cascade rules.

---

# 33. FAILURE RECOVERY
Define recovery for DB outage, API timeout, notification fail, user retry, and mid-operation crashes.

---

# 34. OBSERVABILITY
Specify logging requirements: Correlation IDs, Error traces, Security events, Sanitized log entries.

---

# 35. TESTING MATRIX
| Test | Expected Result |
| --- | --- |
| Valid request | Success (200/201) |
| Missing field / Invalid format | Validation Error (400) |
| Unauthenticated / Forbidden | 401 / 403 |
| Missing resource / Duplicate | 404 / 409 |
| Server / DB failure | Safe 500 |
| Invalid workflow state | Business Rule Error |

---

# 36. COMPLETE END-TO-END FLOW
`User → Auth & Perm Check → Load Data → Form Input → Frontend Validation → API Request → Backend & Business Rules → DB Transaction (Rollback on error / Audit + Notify on success) → API Response → UI Update`

---

# 37. IMPLEMENTATION ORDER
1. DB & Migration  2. Validation  3. Error Types  4. Permissions  5. Data Access  6. Business Logic  7. Routes/Controllers  8. API Tests  9. Frontend API  10. UI & Error Handling  11. Notifications/Audit  12. Integration Tests

---

# 38. AI CODING RULES
1. Do not modify unrelated modules.
2. Do not rename DB fields without checking dependencies.
3. Reuse existing utilities/components.
4. Keep changes isolated & secure.

---

# 39. FINAL DECISION TABLE
Summarize choices for DB, Validation, Auth, Error Handling, Audit, and Pagination with rationale.

---

# 40. FINAL FEATURE CHECKLIST
Verify readiness across: Business rules, Permissions, Database, Backend, Frontend UI, Security, Reliability, and Testing.

---

# FINAL OUTPUT RULE
Use **simple English** with correct technical terms. Format: **What → Why → How → Example**. Output the **system design only** as the single source of truth for implementation.
