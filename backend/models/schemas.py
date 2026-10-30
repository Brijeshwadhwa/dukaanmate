"""
DukaanMate Backend — Pydantic models (schemas) for request/response validation.
All user input is validated here before it ever touches the database.
Pydantic auto-checks types, ranges, and lengths.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum
import re

# ── Enums ─────────────────────────────────────────────────────────────────────

class PaymentMethod(str, Enum):
    cash   = "cash"
    upi    = "upi"
    credit = "credit"

class Language(str, Enum):
    en = "en"
    hi = "hi"
    pa = "pa"

class GSTRate(float, Enum):
    zero      = 0.0
    five      = 5.0
    twelve    = 12.0
    eighteen  = 18.0
    twentyeight = 28.0

# ── Shop ──────────────────────────────────────────────────────────────────────

class ShopCreate(BaseModel):
    shop_name: str         = Field(..., min_length=1, max_length=100)
    owner_name: str        = Field("", max_length=100)
    city: str              = Field("", max_length=100)
    state: str             = Field("Punjab", max_length=100)
    business_type: str     = Field("General Store", max_length=100)
    gst_registered: bool   = False
    gstin: Optional[str]   = Field(None, max_length=15)
    preferred_language: Language = Language.en
    product_category: str  = Field("Food & Grocery", max_length=100)

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v):
        if v is None:
            return v
        pattern = r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$"
        if not re.match(pattern, v.upper()):
            raise ValueError("GSTIN format is invalid. Example: 03ABCDE1234F1Z5")
        return v.upper()

# ── Products ─────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str              = Field(..., min_length=1, max_length=200)
    category: str          = Field("Food & Grocery", max_length=100)
    purchase_price: float  = Field(..., ge=0)
    selling_price: float   = Field(..., ge=0)
    quantity: int          = Field(..., ge=0)
    unit: str              = Field("piece", max_length=50)
    low_stock_limit: int   = Field(5, ge=0)

# ── Sales ─────────────────────────────────────────────────────────────────────

class SaleItem(BaseModel):
    product_id: str        = Field(..., min_length=1)
    quantity: int          = Field(..., ge=1, le=10000)
    unit_price: float      = Field(..., ge=0)

class SaleCreate(BaseModel):
    shop_id: str           = Field(..., min_length=1)
    payment_method: PaymentMethod = PaymentMethod.cash
    items: List[SaleItem]  = Field(..., min_length=1, max_length=50)

# ── Invoices ─────────────────────────────────────────────────────────────────

class InvoiceItem(BaseModel):
    description: str       = Field(..., min_length=1, max_length=200)
    quantity: float        = Field(..., gt=0)
    rate: float            = Field(..., ge=0)
    gst_rate: float        = Field(5.0, ge=0, le=28)

class InvoiceCreate(BaseModel):
    shop_id: str           = Field(..., min_length=1)
    customer_name: str     = Field(..., min_length=1, max_length=200)
    customer_phone: str    = Field("", max_length=15)
    customer_gstin: Optional[str] = Field(None, max_length=15)
    customer_state: str    = Field("Punjab", max_length=100)  # For IGST vs CGST+SGST
    invoice_date: str      = Field(...)  # ISO date string
    items: List[InvoiceItem] = Field(..., min_length=1, max_length=50)

    @field_validator("customer_gstin")
    @classmethod
    def validate_customer_gstin(cls, v):
        if not v:
            return None
        pattern = r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$"
        if not re.match(pattern, v.upper()):
            raise ValueError("Customer GSTIN format is invalid.")
        return v.upper()

# ── Agent Chat ────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str          = Field(..., min_length=1, max_length=500)
    shop_id: str           = Field(..., min_length=1)
    language: Language     = Language.en

# ── Agent Response ────────────────────────────────────────────────────────────

class AnswerCards(BaseModel):
    what_to_do: Optional[str]       = None
    when: Optional[str]             = None
    estimated_profit: Optional[str] = None
    warning: Optional[str]          = None

class AgentResponse(BaseModel):
    answer: str
    cards: Optional[AnswerCards]    = None
    agent_steps: List[str]          = []
    intent: str                     = "general"
    used_gemini: bool               = False

