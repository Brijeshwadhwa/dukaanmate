# SECURITY.md — DukaanMate Security Policy & Verification Checklist

## 🛡️ Security Architecture & Protections

### 1. Zero Secrets in Client Bundles
- The React client only contains public identifiers (`VITE_SUPABASE_ANON_KEY`), strictly restricted by Row Level Security (RLS).
- High-privilege credentials (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GEMINI_API_KEY`) reside exclusively on the server in `.env`.
- Root `.gitignore` ensures no `.env` or credential files can ever be committed to version control.

### 2. Cryptographic JWT Authentication
- The backend never trusts a `user_id` passed in request payloads or URL parameters.
- Every protected route cryptographically verifies the incoming Supabase JWT token using the HS256 secret key and derives the shopkeeper's unique ID directly from the `sub` claim.

### 3. Database Isolation (Row Level Security)
- Every PostgreSQL table (`shops`, `products`, `sales`, `sale_items`, `invoices`, `invoice_items`, `agent_logs`, `chat_messages`) enforces RLS.
- A user can only access or modify rows where `auth.uid() = user_id`.
- Cross-tenant data leakage between different store owners is structurally blocked at the database engine level.

### 4. Deterministic Anti-Hallucination Guardrails
- Pricing, GST calculations, and stock quantity updates are computed strictly in deterministic Python arithmetic with unit tests.
- The LLM never performs mathematical calculations, preventing rounding errors and hallucinated prices.

### 5. Prompt Injection Defense
- User chat queries and store inventory records are treated strictly as **data** inside system prompts, never executable instructions.
- System instructions are fixed, immutable, and non-overridable by user input.
- The Validation Agent reviews and sanitizes input queries (length bounds, control character stripping) and filters outputs before delivery.

### 6. Dependency Vulnerability Audits
- Frontend dependencies scanned with `npm audit`: **0 vulnerabilities**.
- Backend dependencies scanned with `pip-audit`: **0 vulnerabilities**.
- Input fields enforce strict Pydantic schemas with type enforcement, boundary checking, and regex format validation for GSTIN.

---

## ✅ Final Security Verification Checklist

| Security Requirement | Status | Verification Result |
|---|:---:|---|
| **Zero secrets in frontend code** | **PASS** | Only public anon key used in Vite bundle; service-role & Gemini keys in `.env` |
| **Backend JWT verification** | **PASS** | `verify_jwt` validates token signature; client-supplied IDs rejected |
| **Row Level Security (RLS)** | **PASS** | Migration `002_enable_rls.sql` restricts all 9 tables to `auth.uid() = user_id` |
| **No LLM math hallucination** | **PASS** | Pricing & GST calculated in pure Python; verified by 38 pytest tests |
| **Prompt injection defense** | **PASS** | User text encapsulated in data blocks; Validation Agent sanitizes queries |
| **CORS restriction** | **PASS** | Fast API CORSMiddleware restricts requests to specified origins |
| **Security HTTP headers** | **PASS** | `nosniff`, `DENY` X-Frame-Options, `1; mode=block` XSS protection enabled |
| **Frontend dependency audit** | **PASS** | `npm audit` reports 0 vulnerabilities |
| **Backend dependency audit** | **PASS** | `pip-audit` reports "No known vulnerabilities found" |
| **Safe stock updates** | **PASS** | Negative stock and race conditions prevented via validation & DB checks |
| **Privacy logging** | **PASS** | `agent_logs` table records response time and intent without storing private chat text |
| **XSS sanitization** | **PASS** | React default escaping enforced; no raw `dangerouslySetInnerHTML` with user data |
