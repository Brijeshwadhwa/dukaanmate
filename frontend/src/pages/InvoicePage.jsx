/**
 * DukaanMate — GST Invoice Generator & Customer Message Assistant
 * Fully compliant with Phase 6 requirements:
 * - Sequential invoice numbers
 * - Auto CGST+SGST (intra-state) vs IGST (inter-state)
 * - Browser-side PDF generation via jsPDF & autoTable
 * - Invoice history
 * - Customer polite reply generator with WhatsApp share
 * - Clear legal tax disclaimer
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const GST_RATES = [0, 5, 12, 18, 28]
const INDIAN_STATES = ['Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh', 'Rajasthan', 'Himachal Pradesh', 'Maharashtra', 'Other']

const CUSTOMER_SITUATIONS = [
  { id: 'item_available',   icon: '✅', label: 'Item is available' },
  { id: 'price_too_high',   icon: '🏷️', label: 'Customer says price too high' },
  { id: 'delay',            icon: '⏳', label: 'Delivery will be delayed' },
  { id: 'thanks',           icon: '🙏', label: 'Thank the customer' },
  { id: 'payment_reminder', icon: '💳', label: 'Payment reminder' },
]

export default function InvoicePage() {
  const { shop } = useAuth()
  const { t, lang } = useLanguage()

  // Active view: 'new_invoice' | 'history' | 'customer_tool'
  const [activeTab, setActiveTab] = useState('new_invoice')

  // Available store products for auto-filling item rows
  const [products, setProducts] = useState([])

  // Load products for quick dropdown
  useEffect(() => {
    const raw = localStorage.getItem('dukaanmate_demo_products')
    if (raw) {
      setProducts(JSON.parse(raw))
    }
  }, [])

  // ── Invoice Form State ─────────────────────────────────────────────────────
  const [customerName, setCustomerName]   = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')
  const [customerState, setCustomerState] = useState(shop?.state || 'Punjab')
  const [invoiceDate, setInvoiceDate]     = useState(() => new Date().toISOString().split('T')[0])
  const [items, setItems] = useState([
    { description: "Lay's Classic Chips 26g", quantity: 2, rate: 25, gst_rate: 5 },
    { description: "Lifebuoy Soap 100g",       quantity: 1, rate: 38, gst_rate: 5 },
  ])

  // Invoices history stored in localStorage
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('dukaanmate_invoices')
    return saved ? JSON.parse(saved) : []
  })

  // ── Customer Message Tool State ────────────────────────────────────────────
  const [situation, setSituation]           = useState('price_too_high')
  const [customContext, setCustomContext]   = useState('')
  const [itemContext, setItemContext]       = useState('Chips')
  const [priceContext, setPriceContext]     = useState('25')
  const [generatedMessage, setGeneratedMessage] = useState('')

  // Determine intra-state (same state = CGST+SGST) vs inter-state (IGST)
  const isIntrastate = (shop?.state || 'Punjab').trim().toLowerCase() === customerState.trim().toLowerCase()

  // Calculations
  const calculatedLines = items.map(item => {
    const qty = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.rate) || 0
    const taxable = round2(qty * rate)
    const gstRate = parseFloat(item.gst_rate) || 0

    let cgst = 0, sgst = 0, igst = 0
    if (isIntrastate) {
      cgst = round2(taxable * (gstRate / 2) / 100)
      sgst = round2(taxable * (gstRate / 2) / 100)
    } else {
      igst = round2(taxable * gstRate / 100)
    }
    const lineTotal = round2(taxable + cgst + sgst + igst)
    return { ...item, taxable, cgst, sgst, igst, lineTotal }
  })

  const subtotalTaxable = round2(calculatedLines.reduce((s, l) => s + l.taxable, 0))
  const totalCgst       = round2(calculatedLines.reduce((s, l) => s + l.cgst, 0))
  const totalSgst       = round2(calculatedLines.reduce((s, l) => s + l.sgst, 0))
  const totalIgst       = round2(calculatedLines.reduce((s, l) => s + l.igst, 0))
  const totalTax        = round2(totalCgst + totalSgst + totalIgst)
  const grandTotal      = round2(subtotalTaxable + totalTax)

  function round2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, rate: 0, gst_rate: 5 }])
  }

  function removeItem(index) {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value) {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  function onSelectProduct(index, prodId) {
    const prod = products.find(p => p.id === prodId)
    if (prod) {
      setItems(prev => {
        const copy = [...prev]
        copy[index] = {
          description: prod.name,
          quantity: 1,
          rate: prod.selling_price,
          gst_rate: 5,
        }
        return copy
      })
    }
  }

  // ── PDF Generation ─────────────────────────────────────────────────────────
  function generateInvoicePDF(invData) {
    const doc = new jsPDF()
    const shopName = shop?.shop_name || 'Sharma General Store'
    const shopCity = shop?.city || 'Ludhiana'
    const shopState = shop?.state || 'Punjab'
    const shopGstin = shop?.gstin || (shop?.gst_registered ? '03ABCDE1234F1Z5' : 'N/A')

    // Header styling
    doc.setFillColor(249, 115, 22) // Orange theme
    doc.rect(0, 0, 210, 22, 'F')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text('TAX INVOICE', 14, 15)

    doc.setFontSize(10)
    doc.text(`Invoice No: ${invData.invoice_number}`, 140, 10)
    doc.text(`Date: ${invData.invoice_date}`, 140, 16)

    // Supplier Info
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(shopName, 14, 32)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`${shopCity}, ${shopState}`, 14, 38)
    doc.text(`GSTIN: ${shopGstin}`, 14, 43)

    // Customer Info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Billed To:', 120, 32)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Customer: ${invData.customer_name}`, 120, 38)
    if (invData.customer_phone) doc.text(`Phone: ${invData.customer_phone}`, 120, 43)
    doc.text(`Place of Supply: ${invData.customer_state}`, 120, 48)
    if (invData.customer_gstin) doc.text(`Customer GSTIN: ${invData.customer_gstin}`, 120, 53)

    // Table Columns
    const tableHeaders = invData.is_intrastate
      ? [['Item Description', 'Qty', 'Rate', 'Taxable', 'GST%', 'CGST', 'SGST', 'Total']]
      : [['Item Description', 'Qty', 'Rate', 'Taxable', 'GST%', 'IGST', 'Total']]

    const tableBody = invData.lines.map(l => {
      return invData.is_intrastate
        ? [l.description, l.quantity, `INR ${l.rate}`, `INR ${l.taxable}`, `${l.gst_rate}%`, `INR ${l.cgst}`, `INR ${l.sgst}`, `INR ${l.lineTotal}`]
        : [l.description, l.quantity, `INR ${l.rate}`, `INR ${l.taxable}`, `${l.gst_rate}%`, `INR ${l.igst}`, `INR ${l.lineTotal}`]
    })

    autoTable(doc, {
      startY: 58,
      head: tableHeaders,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 3 },
    })

    const finalY = doc.lastAutoTable.finalY + 8

    // Totals Box
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Taxable Amount: INR ${invData.subtotal_taxable.toFixed(2)}`, 130, finalY)

    let nextY = finalY + 5
    if (invData.is_intrastate) {
      doc.text(`CGST Total: INR ${invData.total_cgst.toFixed(2)}`, 130, nextY)
      nextY += 5
      doc.text(`SGST Total: INR ${invData.total_sgst.toFixed(2)}`, 130, nextY)
      nextY += 5
    } else {
      doc.text(`IGST Total: INR ${invData.total_igst.toFixed(2)}`, 130, nextY)
      nextY += 5
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(234, 88, 12)
    doc.text(`Grand Total: INR ${invData.grand_total.toFixed(2)}`, 130, nextY)

    // Disclaimer footer
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(120, 120, 120)
    const disclaimer = 'Disclaimer: This invoice is generated via DukaanMate helper. It is not official tax filing software. Consult an official tax practitioner or GST portal for legal filing.'
    doc.text(disclaimer, 14, 280, { maxWidth: 180 })

    doc.save(`Invoice_${invData.invoice_number}.pdf`)
  }

  function handleSaveInvoice(e) {
    e.preventDefault()
    if (!customerName.trim()) {
      toast.error('Customer name is required.')
      return
    }

    const nextSeq = invoices.length + 1
    const invoiceNumber = `DM-${String(nextSeq).padStart(4, '0')}-${new Date().getFullYear()}`

    const invRecord = {
      id: 'inv-' + Date.now(),
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_gstin: customerGstin.trim().toUpperCase() || null,
      customer_state: customerState,
      is_intrastate: isIntrastate,
      subtotal_taxable: subtotalTaxable,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      total_igst: totalIgst,
      grand_total: grandTotal,
      lines: calculatedLines,
      created_at: new Date().toISOString(),
    }

    const updated = [invRecord, ...invoices]
    setInvoices(updated)
    localStorage.setItem('dukaanmate_invoices', JSON.stringify(updated))

    toast.success(`Invoice ${invoiceNumber} created!`)
    generateInvoicePDF(invRecord)
  }

  // ── Customer Polite Reply Logic ────────────────────────────────────────────
  useEffect(() => {
    generatePoliteReply()
  }, [situation, lang, itemContext, priceContext, customContext])

  function generatePoliteReply() {
    let msg = ''
    if (lang === 'pa') {
      if (situation === 'item_available') msg = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਹਾਂ ਜੀ, ${itemContext || 'ਮਾਲ'} ਸਾਡੀ ਦੁਕਾਨ 'ਤੇ ਉਪਲਬਧ ਹੈ। ਤੁਸੀਂ ਜਦੋਂ ਮਰਜ਼ੀ ਆ ਕੇ ਲੈ ਸਕਦੇ ਹੋ। ਧੰਨਵਾਦ! 🙏`
      else if (situation === 'price_too_high') msg = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਅਸੀਂ ਤੁਹਾਡੀ ਗੱਲ ਸਮਝਦੇ ਹਾਂ। ਅਸੀਂ ਹਮੇਸ਼ਾ ਬਿਹਤਰੀਨ ਕੁਆਲਿਟੀ ਅਤੇ ਜਾਇਜ਼ ਭਾਅ ਦੇਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰਦੇ ਹਾਂ। ਸਾਡਾ ਭਾਅ ₹${priceContext || '25'} ਬਿਲਕੁਲ ਸਹੀ ਹੈ ਜੀ। 🙏`
      else if (situation === 'delay') msg = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਦੇਰੀ ਲਈ ਖਿਮਾ ਚਾਹੁੰਦੇ ਹਾਂ। ਤੁਹਾਡਾ ਸਾਮਾਨ ਜਲਦ ਤਿਆਰ ਹੋ ਜਾਵੇਗਾ। ਧੀਰਜ ਰੱਖਣ ਲਈ ਧੰਨਵਾਦ! 🙏`
      else if (situation === 'thanks') msg = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਖਰੀਦਦਾਰੀ ਕਰਨ ਲਈ ਤੁਹਾਡਾ ਬਹੁਤ-ਬਹੁਤ ਧੰਨਵਾਦ। ਦੁਬਾਰਾ ਜ਼ਰੂਰ ਮੌਕਾ ਦਿਓ ਜੀ! 😊🙏`
      else if (situation === 'payment_reminder') msg = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਇੱਕ ਨਿਮਰ ਯਾਦ ਦਿਵਾਉਣਾ ਸੀ ਕਿ ਬਕਾਇਆ ਰਕਮ ਦਾ ਭੁਗਤਾਨ ਜਦੋਂ ਵੀ ਸੁਵਿਧਾਜਨਕ ਹੋਵੇ ਕਰ ਦੇਣਾ ਜੀ। ਧੰਨਵਾਦ! 🙏`
    } else if (lang === 'hi') {
      if (situation === 'item_available') msg = `नमस्ते जी! जी हाँ, ${itemContext || 'सामान'} हमारी दुकान पर उपलब्ध है। आप जब चाहें आकर ले सकते हैं। धन्यवाद! 🙏`
      else if (situation === 'price_too_high') msg = `नमस्ते जी! हम आपकी बात पूरी तरह समझते हैं। हम हमेशा उत्तम गुणवत्ता और वाजिब दाम ही रखते हैं। हमारा मूल्य ₹${priceContext || '25'} बाज़ार के अनुसार सबसे सही है। 🙏`
      else if (situation === 'delay') msg = `नमस्ते जी! देरी के लिए माफ़ी चाहते हैं। आपका सामान बहुत जल्द तैयार हो जाएगा। इंतज़ार के लिए धन्यवाद! 🙏`
      else if (situation === 'thanks') msg = `नमस्ते जी! हमारी दुकान से खरीदारी करने के लिए आपका बहुत-बहुत शुक्रिया। फिर पधारें! 😊🙏`
      else if (situation === 'payment_reminder') msg = `नमस्ते जी! यह आपके बकाया भुगतान की एक विनम्र याद दिलाने के लिए है। सुविधा अनुसार कृपया भुगतान कर दें। धन्यवाद! 🙏`
    } else {
      if (situation === 'item_available') msg = `Namaste! Yes, ${itemContext || 'the item'} is available in our store. You can visit anytime to collect it. Thank you! 🙏`
      else if (situation === 'price_too_high') msg = `Namaste! We understand your concern. We always ensure top quality at the fairest price. Our rate of ₹${priceContext || '25'} is very reasonable and fair. 🙏`
      else if (situation === 'delay') msg = `Namaste! We sincerely apologize for the delay. Your order will be ready very shortly. Thank you for your patience! 🙏`
      else if (situation === 'thanks') msg = `Namaste! Thank you so much for shopping with us. We truly value your business and hope to see you again! 😊🙏`
      else if (situation === 'payment_reminder') msg = `Namaste! This is a gentle reminder regarding the pending payment. Whenever convenient, please settle the amount. Thank you! 🙏`
    }
    setGeneratedMessage(msg)
  }

  function copyMessage() {
    navigator.clipboard.writeText(generatedMessage)
    toast.success('Message copied to clipboard! 📋')
  }

  function openWhatsApp() {
    const encoded = encodeURIComponent(generatedMessage)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="page-wrapper pb-24">
      {/* Header */}
      <div className="page-header justify-between">
        <div>
          <h2 className="text-orange-700">🧾 {t('gstInvoice')}</h2>
          <p className="text-xs text-gray-500">Invoice generator & customer assistant</p>
        </div>
        <LanguageSelector />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-orange-100 bg-white px-4 pt-2">
        <button
          onClick={() => setActiveTab('new_invoice')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
            activeTab === 'new_invoice' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'
          }`}
        >
          + New Invoice
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
            activeTab === 'history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'
          }`}
        >
          History ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('customer_tool')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 text-center transition-colors ${
            activeTab === 'customer_tool' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'
          }`}
        >
          💬 WhatsApp Tool
        </button>
      </div>

      {/* TAB 1: NEW INVOICE */}
      {activeTab === 'new_invoice' && (
        <form onSubmit={handleSaveInvoice} className="p-4 flex flex-col gap-4">
          <div className="card border-orange-200 bg-orange-50/50 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide">Customer & State Details</h3>
            
            <div>
              <label className="label">Customer Name *</label>
              <input
                className="input"
                placeholder="e.g. Gurpreet Singh"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone (Optional)</label>
                <input
                  className="input"
                  placeholder="9876543210"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Place of Supply (State)</label>
                <select
                  className="input"
                  value={customerState}
                  onChange={e => setCustomerState(e.target.value)}
                >
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Customer GSTIN (Optional)</label>
              <input
                className="input uppercase"
                placeholder="03ABCDE1234F1Z5"
                value={customerGstin}
                maxLength={15}
                onChange={e => setCustomerGstin(e.target.value)}
              />
            </div>

            {/* Tax category badge */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                isIntrastate ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isIntrastate ? '🇮🇳 Intra-State Sale (CGST + SGST apply)' : '🚚 Inter-State Sale (IGST applies)'}
              </span>
            </div>
          </div>

          {/* Line items */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-200"
              >
                + Add Item
              </button>
            </div>

            {items.map((item, index) => {
              const line = calculatedLines[index]
              return (
                <div key={index} className="card border-gray-200 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {products.length > 0 && (
                    <select
                      className="input text-xs !min-h-[38px] bg-gray-50"
                      onChange={e => onSelectProduct(index, e.target.value)}
                      defaultValue=""
                    >
                      <option value="">Quick select from shop stock...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.selling_price})</option>
                      ))}
                    </select>
                  )}

                  <input
                    className="input"
                    placeholder="Description (e.g. Lay's Chips)"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label text-[11px]">Qty</label>
                      <input
                        className="input text-sm"
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="label text-[11px]">Rate (₹)</label>
                      <input
                        className="input text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={e => updateItem(index, 'rate', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="label text-[11px]">GST Rate</label>
                      <select
                        className="input text-sm"
                        value={item.gst_rate}
                        onChange={e => updateItem(index, 'gst_rate', e.target.value)}
                      >
                        {GST_RATES.map(r => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line calculation summary */}
                  <div className="bg-gray-50 p-2 rounded-lg flex justify-between text-xs text-gray-600">
                    <span>Taxable: ₹{line?.taxable.toFixed(2)}</span>
                    {isIntrastate ? (
                      <span>CGST: ₹{line?.cgst.toFixed(2)} | SGST: ₹{line?.sgst.toFixed(2)}</span>
                    ) : (
                      <span>IGST: ₹{line?.igst.toFixed(2)}</span>
                    )}
                    <span className="font-bold text-orange-600">Total: ₹{line?.lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Grand Totals Card */}
          <div className="card bg-orange-50 border-orange-200 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal Taxable:</span>
              <span className="font-semibold">₹{subtotalTaxable.toFixed(2)}</span>
            </div>
            {isIntrastate ? (
              <>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>CGST:</span>
                  <span className="font-semibold">₹{totalCgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>SGST:</span>
                  <span className="font-semibold">₹{totalSgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm text-gray-700">
                <span>IGST:</span>
                <span className="font-semibold">₹{totalIgst.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-orange-200 pt-2 flex justify-between text-lg font-bold text-orange-700">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="card bg-amber-50 border-amber-200 text-xs text-amber-900 leading-relaxed">
            {t('gstDisclaimer')}
          </div>

          <button type="submit" className="btn-primary flex items-center justify-center gap-2">
            <span>📄</span>
            <span>Save & Download PDF</span>
          </button>
        </form>
      )}

      {/* TAB 2: INVOICE HISTORY */}
      {activeTab === 'history' && (
        <div className="p-4 flex flex-col gap-3">
          {invoices.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">🧾</span>
              <p>No invoices generated yet.</p>
            </div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="card flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-orange-700">{inv.invoice_number}</span>
                    <p className="text-sm font-medium text-gray-800">{inv.customer_name}</p>
                    <p className="text-xs text-gray-400">{inv.invoice_date} · {inv.customer_state}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">₹{Number(inv.grand_total).toFixed(2)}</span>
                    <span className="block text-[11px] text-gray-500">
                      {inv.is_intrastate ? 'CGST+SGST' : 'IGST'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{inv.lines.length} items</span>
                  <button
                    onClick={() => generateInvoicePDF(inv)}
                    className="btn-secondary !py-1 !px-3 text-xs"
                  >
                    📄 Download PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER MESSAGE TOOL */}
      {activeTab === 'customer_tool' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="card border-blue-100 bg-blue-50/50">
            <h3 className="text-sm font-bold text-blue-900 mb-1">💬 Polite Customer Reply Assistant</h3>
            <p className="text-xs text-blue-700">
              Pick a customer situation and generate a respectful response in your chosen language.
            </p>
          </div>

          <div>
            <label className="label">Select Situation</label>
            <div className="grid grid-cols-1 gap-2">
              {CUSTOMER_SITUATIONS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSituation(s.id)}
                  className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-colors ${
                    situation === s.id ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {situation === 'item_available' && (
            <div>
              <label className="label">Product / Item Name</label>
              <input
                className="input"
                value={itemContext}
                onChange={e => setItemContext(e.target.value)}
                placeholder="e.g. Lay's Chips"
              />
            </div>
          )}

          {situation === 'price_too_high' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Item Name</label>
                <input
                  className="input"
                  value={itemContext}
                  onChange={e => setItemContext(e.target.value)}
                  placeholder="Chips"
                />
              </div>
              <div>
                <label className="label">Price (₹)</label>
                <input
                  className="input"
                  value={priceContext}
                  onChange={e => setPriceContext(e.target.value)}
                  placeholder="25"
                />
              </div>
            </div>
          )}

          {/* Generated message preview */}
          <div className="card border-green-200 bg-green-50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Polite Message</span>
              <span className="text-xs text-green-700 font-semibold">{lang.toUpperCase()}</span>
            </div>
            <p className="text-sm text-green-900 leading-relaxed font-sans">{generatedMessage}</p>
            
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={copyMessage}
                className="flex-1 bg-white border border-green-300 text-green-800 font-semibold py-2 px-3 rounded-xl text-xs hover:bg-green-100 flex items-center justify-center gap-1.5"
              >
                <span>📋</span>
                <span>Copy Message</span>
              </button>
              <button
                type="button"
                onClick={openWhatsApp}
                className="flex-1 bg-green-600 text-white font-semibold py-2 px-3 rounded-xl text-xs hover:bg-green-700 flex items-center justify-center gap-1.5"
              >
                <span>💬</span>
                <span>Send on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
