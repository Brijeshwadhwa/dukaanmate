# DukaanMate (ਦੁਕਾਨਮੇਟ / दुकानमेट)

> **"Stock, price, customers aur GST — sab ek jagah."**  
> *A multi-agent smart assistant designed for local shopkeepers in India (Punjab).*

---

## 🌟 What is DukaanMate?

DukaanMate is a free-to-host web application designed for non-technical retail shopkeepers (kirana store, general store, medical, etc.) in India. It helps owners manage:
1. **Inventory & Low Stock**: Automatic alerts when items run out and automated reorder suggestions.
2. **Deterministic Smart Pricing**: Cost + Profit margin calculations in pure Python (no AI math mistakes).
3. **Polite WhatsApp Customer Messages**: Professional responses in Punjabi (ਪੰਜਾਬੀ), Hindi (हिंदी), and English with a 1-click WhatsApp button.
4. **GST Tax Invoice Helper**: Intra-state (CGST + SGST) vs Inter-state (IGST) automatic breakdown with in-browser PDF download.
5. **Multi-Agent Assistant Chat**: Ask questions in plain language with a visible step-by-step Agent Activity trace!

---

## 🚀 Quick Start (Instant Zero-Setup Test)

You do **NOT** need any API keys to test DukaanMate immediately!

### 1. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 2. Run the Backend (Python FastAPI)
In a second terminal window:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # On Windows (or source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Log In to Demo Store
On the login screen (`http://localhost:5173`), simply click:  
**`🏪 Try Demo Store (Sharma General Store)`**  
You will instantly be logged in with 15 pre-loaded store products and 2 low-stock alerts!

---

## 🔑 How to Set Up Free Cloud Services (Supabase & Gemini)

When you are ready to connect live cloud services, follow these plain-language steps:

### 1. Supabase (Database & User Accounts) — 100% Free
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (sign in with Google or GitHub).
2. Click **New Project**, choose a project name (e.g., `dukaanmate`), and set a database password.
3. Once created, go to **Project Settings** (gear icon at bottom left) ➔ **API**:
   - Copy **Project URL**
   - Copy **Project API Key (`anon` / public)**
   - Copy **Project API Key (`service_role` / secret)**
4. In Supabase Dashboard, click **SQL Editor** (terminal icon on left menu) ➔ **New Query**:
   - Open [supabase/migrations/001_create_tables.sql](supabase/migrations/001_create_tables.sql), paste the content and click **Run**.
   - Open [supabase/migrations/002_enable_rls.sql](supabase/migrations/002_enable_rls.sql), paste the content and click **Run**.
5. Save your keys in environment files:
   - In `frontend/.env.local`:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-public-anon-key
     VITE_API_URL=http://localhost:8000
     ```
   - In `backend/.env`:
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
     SUPABASE_JWT_SECRET=your-jwt-secret-from-api-settings
     ALLOWED_ORIGINS=http://localhost:5173
     ```

### 2. Google Gemini API (Optional AI Language Polish) — 100% Free Tier
*Note: DukaanMate works 100% without Gemini using built-in rule-based templates. Gemini is only used to enhance tone.*
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account and click **Create API Key**.
3. In `backend/.env`, paste your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your-gemini-key
   GEMINI_MODEL=gemini-2.0-flash-lite
   ```

---

## 🌐 How to Deploy for Free

### Frontend on Vercel
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your `dukaanmate` repository and set the **Root Directory** to `frontend`.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your Render backend URL)
5. Click **Deploy**!

### Backend on Render
1. Sign in to [Render](https://render.com) and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository and set **Root Directory** to `backend`.
3. Set:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `ALLOWED_ORIGINS` (your Vercel app domain, e.g. `https://dukaanmate.vercel.app`)
   - `GEMINI_API_KEY` (optional)
5. Click **Create Web Service**!

---

## 🧪 Testing & Verification

Run backend unit tests:
```bash
cd backend
.\venv\Scripts\pytest tests/ -v
```
All **38 unit tests** verify:
- Pricing formula & margins
- GST calculation (intra-state vs inter-state)
- Stock reorder analysis & critical threshold detection
- Multilingual intent routing in English, Hindi, and Punjabi
- Input sanitization & security checks

Run security vulnerability audit:
```bash
cd frontend && npm audit
cd backend && pip-audit
```
Both report **0 high/critical vulnerabilities**.

---

## 📄 Documentation Links
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — Step-by-step test walkthrough
- [ARCHITECTURE.md](ARCHITECTURE.md) — Architecture explanation & Mermaid diagram
- [SECURITY.md](SECURITY.md) — Security checklist & threat mitigations
