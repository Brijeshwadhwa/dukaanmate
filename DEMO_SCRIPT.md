# DukaanMate — Complete Demo & Presentation Script

This script gives you an exact, step-by-step walkthrough to test the app yourself or present it to an audience or evaluator.

---

## 🎯 Step 1: Open DukaanMate & One-Click Login
1. Open the app in your browser (`http://localhost:5173` or your Vercel deployment URL).
2. On the login screen, notice the clean, mobile-first design and the language selector at top right (**EN / हि / ਪੰ**).
3. Click the **"🏪 Try Demo Store (Sharma General Store)"** button.
   - *Result*: You are instantly logged in as Ramesh Sharma, owner of Sharma General Store in Ludhiana, Punjab.

---

## 📦 Step 2: Dashboard & Low-Stock Alerts
1. On the Dashboard, review today's sales and profit summary.
2. Observe the red **"⚠️ Low Stock Alerts (2)"** banner:
   - **Harvest Gold Bread 400g**: only 3 pieces left (alert threshold is 5).
   - **Pears Soap 75g**: only 2 pieces left (alert threshold is 5).
3. Click **"Stock dekho →"** or the bottom **Inventory (📦)** tab to view all 15 store products.

---

## 🤖 Step 3: Multi-Agent Smart Assistant
Tap the **Smart Assistant (🤖)** icon in the bottom navigation bar.

### Test A: Stock Advice
1. Type or tap the suggestion:
   > *"What should I reorder today?"* (or in Punjabi: *"ਅੱਜ ਕੀ ਮੰਗਵਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?"*)
2. Watch the **🔍 Agent Activity panel** appear:
   - `Validation Agent`: Checks your input query.
   - `Orchestrator`: Routes to `Inventory Advisor Agent`.
   - `Inventory Advisor Agent`: Checks stock levels deterministically in Python.
3. Observe the response:
   - Advises ordering Harvest Gold Bread (critical) and Pears Soap (critical).
   - Structured action card appears with **"What to do"** and **"When"** (`Aaj ya kal tak`).

### Test B: Smart Pricing Calculation
1. Enter the demo question:
   > *"Mere paas 10 packets chips hain, cost ₹18 hai, price kitna rakhun?"*
2. Watch the Agent Activity panel:
   - `Pricing Agent`: Calculates `Cost ₹18 + Profit ₹7 = Suggested Selling Price ₹25`.
   - Warns that selling below ₹22 leaves a dangerously small margin.
3. Observe the structured cards:
   - **✅ What to do**: Selling price ₹25 rakhein.
   - **💰 Estimated Profit**: ₹7 profit per item.
   - **⚠️ Warning**: If price set too low, alert warns of minimal profit.

---

## 💬 Step 4: Customer Polite WhatsApp Reply
1. Go to the **Invoice (🧾)** tab and click **"💬 WhatsApp Tool"**.
2. Select the situation:
   - Click **"🏷️ Customer says price too high"**.
   - Item Name: `Chips`
   - Price: `25`
3. Notice the immediate respectful reply generated in your selected language:
   - In Punjabi: *"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਅਸੀਂ ਤੁਹਾਡੀ ਗੱਲ ਸਮਝਦੇ ਹਾਂ... ਸਾਡਾ ਭਾਅ ₹25 ਬਿਲਕੁਲ ਸਹੀ ਹੈ ਜੀ। 🙏"*
   - In Hindi: *"नमस्ते जी! हम आपकी बात पूरी तरह समझते हैं... हमारा मूल्य ₹25 बाज़ार के अनुसार सबसे सही है। 🙏"*
4. Click **"📋 Copy Message"** to copy to your clipboard, or **"💬 Send on WhatsApp"** to launch `wa.me`.

---

## 🧾 Step 5: GST Invoice with CGST / SGST & PDF Download
1. In the **Invoice (🧾)** tab, choose **"+ New Invoice"**.
2. Enter Customer: `Gurpreet Singh`, Phone: `9876543210`, State: `Punjab` (Intra-state).
3. Line items:
   - Item 1: `Lay's Classic Chips 26g` — Qty: `2`, Rate: `₹25`, GST: `5%`
     - Taxable = ₹50.00, CGST (2.5%) = ₹1.25, SGST (2.5%) = ₹1.25
   - Item 2: `Lifebuoy Soap 100g` — Qty: `1`, Rate: `₹38`, GST: `5%`
     - Taxable = ₹38.00, CGST (2.5%) = ₹0.95, SGST (2.5%) = ₹0.95
4. Review the Grand Totals card:
   - Subtotal Taxable: ₹88.00
   - CGST Total: ₹2.20
   - SGST Total: ₹2.20
   - Grand Total: ₹92.40
5. Note the clear tax disclaimer:
   - *"This tool helps you create invoices and understand GST. It is not official tax filing software."*
6. Click **"📄 Save & Download PDF"**.
   - The browser automatically generates and downloads `Invoice_DM-0001-2026.pdf` formatted with store name, address, GSTIN, clean itemized table, and tax breakdown!

