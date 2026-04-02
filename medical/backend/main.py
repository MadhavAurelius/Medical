from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, date
from jose import jwt, JWTError
from passlib.context import CryptContext
import uuid, csv, io
from auth import hash_password, verify_password, create_access_token, get_current_user, require_admin
from db import users_collection, medicines_collection, bills_collection, suppliers_collection, purchases_collection

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="MedBill API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Seed ─────────────────────────────────────────────────────────────────────
def seed_medicines():
    if medicines_collection.count_documents({}) == 0:
        medicines_collection.insert_many([
            {"id":"M001","name":"Paracetamol 500mg", "price":2.50, "cost_price":1.00, "stock":200,"category":"Analgesic",     "expiry_date":"2026-12-31","min_stock_threshold":20,"active":True},
            {"id":"M002","name":"Amoxicillin 250mg", "price":8.00, "cost_price":4.00, "stock":150,"category":"Antibiotic",    "expiry_date":"2026-06-30","min_stock_threshold":20,"active":True},
            {"id":"M003","name":"Cetrizine 10mg",    "price":3.00, "cost_price":1.20, "stock":180,"category":"Antihistamine", "expiry_date":"2025-11-30","min_stock_threshold":20,"active":True},
            {"id":"M004","name":"Metformin 500mg",   "price":5.50, "cost_price":2.50, "stock":120,"category":"Antidiabetic",  "expiry_date":"2026-09-30","min_stock_threshold":20,"active":True},
            {"id":"M005","name":"Omeprazole 20mg",   "price":6.00, "cost_price":3.00, "stock":160,"category":"Antacid",       "expiry_date":"2027-03-31","min_stock_threshold":20,"active":True},
            {"id":"M006","name":"Vitamin C 500mg",   "price":4.00, "cost_price":1.50, "stock":300,"category":"Supplement",    "expiry_date":"2027-06-30","min_stock_threshold":20,"active":True},
            {"id":"M007","name":"Aspirin 75mg",      "price":1.50, "cost_price":0.50, "stock":250,"category":"Analgesic",     "expiry_date":"2026-12-31","min_stock_threshold":20,"active":True},
            {"id":"M008","name":"Azithromycin 500mg","price":12.00,"cost_price":6.00, "stock":80, "category":"Antibiotic",    "expiry_date":"2025-12-31","min_stock_threshold":20,"active":True},
        ])
seed_medicines()

# ─── Helper Functions ─────────────────────────────────────────────────────────
def clean(doc: dict) -> dict:
    """Remove MongoDB's _id field from a document"""
    doc.pop("_id", None)
    return doc

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "cashier"   # admin | cashier | viewer

class UserLogin(BaseModel):
    username: str
    password: str

class MedicineCreate(BaseModel):
    name: str
    price: float
    cost_price: Optional[float] = 0.0
    stock: int
    category: str
    expiry_date: Optional[str] = None
    min_stock_threshold: Optional[int] = 20

class MedicineUpdate(BaseModel):
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock: Optional[int] = None
    expiry_date: Optional[str] = None
    min_stock_threshold: Optional[int] = None
    active: Optional[bool] = None

class BillItem(BaseModel):
    medicine_id: str
    quantity: int

class BillCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = ""
    doctor_name: Optional[str] = ""
    items: List[BillItem]
    discount_percent: Optional[float] = 0.0
    payment_mode: Optional[str] = "cash"   # cash | upi | card
    prescription_url: Optional[str] = None

class RefundCreate(BaseModel):
    reason: Optional[str] = "Customer return"

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""

class PurchaseItem(BaseModel):
    medicine_id: str
    quantity: int
    cost_price: float

class PurchaseCreate(BaseModel):
    supplier_id: str
    items: List[PurchaseItem]
    notes: Optional[str] = ""

# ─── Auth Endpoints ───────────────────────────────────────────────────────────
@app.post("/signup")
def signup(user: UserCreate):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(400, "Username already exists")
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(400, "Email already exists")
    doc = user.model_dump()
    doc["hashed_password"] = hash_password(doc.pop("password"))
    users_collection.insert_one(doc)
    return {"username": user.username, "email": user.email, "role": user.role}

@app.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(400, "Invalid credentials")
    token = create_access_token({"sub": user.username, "role": db_user.get("role", "cashier")})
    return {"access_token": token, "token_type": "bearer", "role": db_user.get("role", "cashier")}

@app.get("/profile")
def profile(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "email": current_user["email"], "role": current_user.get("role", "cashier")}

@app.get("/users")
def list_users(_: dict = Depends(require_admin)):
    return [{"username": u["username"], "email": u["email"], "role": u.get("role", "cashier")}
            for u in users_collection.find()]

@app.patch("/users/{username}/role")
def update_role(username: str, body: dict, _: dict = Depends(require_admin)):
    users_collection.update_one({"username": username}, {"$set": {"role": body["role"]}})
    return {"ok": True}

# ─── Medicine Endpoints ───────────────────────────────────────────────────────
# ✅ FIX: Static/specific routes MUST come before dynamic /{medicine_id} routes.
#    FastAPI matches top-to-bottom; if /{medicine_id} is first, it captures
#    "alerts", "all", "import" etc. as the medicine_id param → 404 / wrong handler.

@app.get("/medicines")
def get_medicines(_: dict = Depends(get_current_user)):
    return [clean(m) for m in medicines_collection.find({"active": {"$ne": False}})]

@app.get("/medicines/all")
def get_all_medicines(_: dict = Depends(get_current_user)):
    return [clean(m) for m in medicines_collection.find()]

# ── Alert routes — MUST be above /{medicine_id} ──────────────────────────────

@app.get("/medicines/alerts/summary")
def alert_summary(_: dict = Depends(get_current_user)):
    today = datetime.now().date()
    meds  = list(medicines_collection.find({"active": {"$ne": False}}))
    expired = expiring = low = 0
    for m in meds:
        if m.get("expiry_date"):
            d = (date.fromisoformat(m["expiry_date"]) - today).days
            if d < 0:    expired  += 1
            elif d <= 90: expiring += 1
        thr = m.get("min_stock_threshold", 20)
        if m["stock"] < thr: low += 1
    return {
        "expired_count":       expired,
        "expiring_soon_count": expiring,
        "low_stock_count":     low,
        "total_alerts":        expired + expiring + low,
    }

@app.get("/medicines/alerts/expiry")
def expiry_alerts(days: int = 90, _: dict = Depends(get_current_user)):
    today  = datetime.now().date()
    cutoff = today + timedelta(days=days)
    expired, soon = [], []
    for m in medicines_collection.find({"active": {"$ne": False}, "expiry_date": {"$ne": None}}):
        d = (date.fromisoformat(m["expiry_date"]) - today).days
        m = clean(m); m["days_until_expiry"] = d
        if d < 0:
            m["status"] = "expired";        expired.append(m)
        elif d <= days:
            m["status"] = "expiring_soon";  soon.append(m)
    return {
        "expired":             expired,
        "expiring_soon":       soon,
        "expired_count":       len(expired),
        "expiring_soon_count": len(soon),
    }

@app.get("/medicines/alerts/low-stock")
def low_stock_alerts(_: dict = Depends(get_current_user)):
    items = []
    for m in medicines_collection.find({"active": {"$ne": False}}):
        thr = m.get("min_stock_threshold", 20)
        if m["stock"] < thr:
            m = clean(m); m["shortage"] = thr - m["stock"]; items.append(m)
    return {"items": items, "low_stock_count": len(items)}

# ── CSV import — also static, must be above /{medicine_id} ───────────────────

@app.post("/medicines/import/csv")
async def import_medicines_csv(file: UploadFile = File(...), _: dict = Depends(get_current_user)):
    """CSV columns: name, price, cost_price, stock, category, expiry_date, min_stock_threshold"""
    content = await file.read()
    reader  = csv.DictReader(io.StringIO(content.decode("utf-8")))
    added, skipped = 0, 0
    for row in reader:
        name = row.get("name", "").strip()
        if not name: continue
        if medicines_collection.find_one({"name": name, "active": {"$ne": False}}):
            skipped += 1; continue
        new_id = f"M{str(medicines_collection.count_documents({}) + 1).zfill(3)}"
        medicines_collection.insert_one({
            "id":                  new_id,
            "name":                name,
            "price":               float(row.get("price", 0)),
            "cost_price":          float(row.get("cost_price", 0)),
            "stock":               int(row.get("stock", 0)),
            "category":            row.get("category", "").strip(),
            "expiry_date":         row.get("expiry_date", "").strip() or None,
            "min_stock_threshold": int(row.get("min_stock_threshold", 20)),
            "active": True,
        })
        added += 1
    return {"added": added, "skipped": skipped}

# ── Dynamic route LAST ────────────────────────────────────────────────────────

@app.get("/medicines/{medicine_id}")
def get_medicine(medicine_id: str, _: dict = Depends(get_current_user)):
    m = medicines_collection.find_one({"id": medicine_id})
    if not m: raise HTTPException(404, "Medicine not found")
    return clean(m)

@app.post("/medicines", status_code=201)
def add_medicine(medicine: MedicineCreate, _: dict = Depends(get_current_user)):
    new_id  = f"M{str(medicines_collection.count_documents({}) + 1).zfill(3)}"
    new_med = {"id": new_id, **medicine.model_dump(), "active": True}
    medicines_collection.insert_one(new_med)
    return clean(new_med)

@app.patch("/medicines/{medicine_id}")
def update_medicine(medicine_id: str, updates: MedicineUpdate, _: dict = Depends(get_current_user)):
    if not medicines_collection.find_one({"id": medicine_id}):
        raise HTTPException(404, "Medicine not found")
    patch = {k: v for k, v in updates.model_dump().items() if v is not None}
    medicines_collection.update_one({"id": medicine_id}, {"$set": patch})
    return clean(medicines_collection.find_one({"id": medicine_id}))

@app.delete("/medicines/{medicine_id}")
def delete_medicine(medicine_id: str, _: dict = Depends(require_admin)):
    """Soft delete — sets active=False"""
    medicines_collection.update_one({"id": medicine_id}, {"$set": {"active": False}})
    return {"ok": True, "message": "Medicine deactivated"}

# ─── Bill Endpoints ───────────────────────────────────────────────────────────
@app.post("/bills", status_code=201)
def create_bill(bill: BillCreate, current_user: dict = Depends(get_current_user)):
    line_items, subtotal = [], 0.0
    for item in bill.items:
        med = medicines_collection.find_one({"id": item.medicine_id})
        if not med: raise HTTPException(404, f"Medicine {item.medicine_id} not found")
        if med["stock"] < item.quantity:
            raise HTTPException(400, f"Insufficient stock for {med['name']}. Available: {med['stock']}")
        lt = med["price"] * item.quantity; subtotal += lt
        line_items.append({
            "medicine_id":   item.medicine_id,
            "medicine_name": med["name"],
            "unit_price":    med["price"],
            "cost_price":    med.get("cost_price", 0),
            "quantity":      item.quantity,
            "total":         lt,
        })
        medicines_collection.update_one({"id": item.medicine_id}, {"$inc": {"stock": -item.quantity}})
    disc   = subtotal * (bill.discount_percent / 100)
    tax    = (subtotal - disc) * 0.05
    grand  = subtotal - disc + tax
    profit = sum((it["unit_price"] - it.get("cost_price", 0)) * it["quantity"] for it in line_items) - disc
    doc    = {
        "id":               str(uuid.uuid4())[:8].upper(),
        "customer_name":    bill.customer_name,
        "customer_phone":   bill.customer_phone,
        "doctor_name":      bill.doctor_name,
        "items":            line_items,
        "subtotal":         round(subtotal, 2),
        "discount_percent": bill.discount_percent,
        "discount_amount":  round(disc, 2),
        "tax_amount":       round(tax, 2),
        "grand_total":      round(grand, 2),
        "profit":           round(profit, 2),
        "payment_mode":     bill.payment_mode or "cash",
        "prescription_url": bill.prescription_url,
        "created_at":       datetime.now().isoformat(),
        "created_by":       current_user["username"],
        "status":           "paid",
    }
    bills_collection.insert_one(doc)
    return clean(doc)

@app.get("/bills")
def get_bills(
    patient:      Optional[str]   = None,
    doctor:       Optional[str]   = None,
    from_date:    Optional[str]   = None,
    to_date:      Optional[str]   = None,
    min_amount:   Optional[float] = None,
    max_amount:   Optional[float] = None,
    payment_mode: Optional[str]   = None,
    status:       Optional[str]   = None,
    _: dict = Depends(get_current_user)
):
    query = {}
    if patient:      query["customer_name"]  = {"$regex": patient, "$options": "i"}
    if doctor:       query["doctor_name"]    = {"$regex": doctor,  "$options": "i"}
    if payment_mode: query["payment_mode"]   = payment_mode
    if status:       query["status"]         = status
    if from_date or to_date:
        query["created_at"] = {}
        if from_date: query["created_at"]["$gte"] = from_date
        if to_date:   query["created_at"]["$lte"] = to_date + "T23:59:59"
    if min_amount is not None or max_amount is not None:
        query["grand_total"] = {}
        if min_amount is not None: query["grand_total"]["$gte"] = min_amount
        if max_amount is not None: query["grand_total"]["$lte"] = max_amount
    return [clean(b) for b in bills_collection.find(query).sort("created_at", -1)]

@app.get("/bills/{bill_id}")
def get_bill(bill_id: str, _: dict = Depends(get_current_user)):
    b = bills_collection.find_one({"id": bill_id})
    if not b: raise HTTPException(404, "Bill not found")
    return clean(b)

@app.post("/bills/{bill_id}/refund")
def refund_bill(bill_id: str, body: RefundCreate, current_user: dict = Depends(get_current_user)):
    b = bills_collection.find_one({"id": bill_id})
    if not b: raise HTTPException(404, "Bill not found")
    if b.get("status") == "refunded": raise HTTPException(400, "Already refunded")
    for it in b.get("items", []):
        medicines_collection.update_one({"id": it["medicine_id"]}, {"$inc": {"stock": it["quantity"]}})
    bills_collection.update_one({"id": bill_id}, {"$set": {
        "status":      "refunded",
        "refund_reason": body.reason,
        "refunded_at": datetime.now().isoformat(),
        "refunded_by": current_user["username"],
    }})
    return {"ok": True, "message": "Bill refunded and stock restored"}

# ─── Patient History ──────────────────────────────────────────────────────────
@app.get("/patients/search")
def search_patients(q: str, _: dict = Depends(get_current_user)):
    # ✅ FIX: static /patients/search must be above /patients/{phone}
    pipeline = [
        {"$match": {"$or": [
            {"customer_name":  {"$regex": q, "$options": "i"}},
            {"customer_phone": {"$regex": q, "$options": "i"}},
        ]}},
        {"$group": {
            "_id":        "$customer_phone",
            "name":       {"$first": "$customer_name"},
            "phone":      {"$first": "$customer_phone"},
            "bill_count": {"$sum": 1},
            "total_spent":{"$sum": "$grand_total"},
            "last_visit": {"$max":  "$created_at"},
        }},
        {"$sort": {"last_visit": -1}},
        {"$limit": 20},
    ]
    return list(bills_collection.aggregate(pipeline))

@app.get("/patients/{phone}/history")
def patient_history(phone: str, _: dict = Depends(get_current_user)):
    bills = [clean(b) for b in bills_collection.find({"customer_phone": phone}).sort("created_at", -1)]
    if not bills: raise HTTPException(404, "No bills found for this patient")
    total_spent = sum(b["grand_total"] for b in bills if b.get("status") != "refunded")
    return {
        "phone":         phone,
        "customer_name": bills[0]["customer_name"] if bills else "",
        "total_bills":   len(bills),
        "total_spent":   round(total_spent, 2),
        "bills":         bills,
    }

# ─── Suppliers ────────────────────────────────────────────────────────────────
@app.get("/suppliers")
def get_suppliers(_: dict = Depends(get_current_user)):
    return [clean(s) for s in suppliers_collection.find()]

@app.post("/suppliers", status_code=201)
def add_supplier(supplier: SupplierCreate, _: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4())[:8].upper(),
        **supplier.model_dump(),
        "created_at": datetime.now().isoformat(),
    }
    suppliers_collection.insert_one(doc)
    return clean(doc)

# ─── Purchases (Restock) ──────────────────────────────────────────────────────
@app.get("/purchases")
def get_purchases(_: dict = Depends(get_current_user)):
    return [clean(p) for p in purchases_collection.find().sort("created_at", -1)]

@app.post("/purchases", status_code=201)
def create_purchase(purchase: PurchaseCreate, current_user: dict = Depends(get_current_user)):
    supplier = suppliers_collection.find_one({"id": purchase.supplier_id})
    if not supplier: raise HTTPException(404, "Supplier not found")
    line_items, total_cost = [], 0.0
    for it in purchase.items:
        med = medicines_collection.find_one({"id": it.medicine_id})
        if not med: raise HTTPException(404, f"Medicine {it.medicine_id} not found")
        lt = it.cost_price * it.quantity; total_cost += lt
        medicines_collection.update_one({"id": it.medicine_id}, {
            "$inc": {"stock": it.quantity},
            "$set": {"cost_price": it.cost_price},
        })
        line_items.append({
            "medicine_id":   it.medicine_id,
            "medicine_name": med["name"],
            "quantity":      it.quantity,
            "cost_price":    it.cost_price,
            "total":         lt,
        })
    doc = {
        "id":            str(uuid.uuid4())[:8].upper(),
        "supplier_id":   purchase.supplier_id,
        "supplier_name": supplier["name"],
        "items":         line_items,
        "total_cost":    round(total_cost, 2),
        "notes":         purchase.notes,
        "created_at":    datetime.now().isoformat(),
        "created_by":    current_user["username"],
    }
    purchases_collection.insert_one(doc)
    return clean(doc)

# ─── Dashboard ────────────────────────────────────────────────────────────────
@app.get("/dashboard/stats")
def get_stats(_: dict = Depends(get_current_user)):
    today       = datetime.now().date().isoformat()
    all_bills   = list(bills_collection.find())
    paid_bills  = [b for b in all_bills if b.get("status") == "paid"]
    today_bills = [b for b in paid_bills if b.get("created_at", "")[:10] == today]
    low_stock   = [clean(m) for m in medicines_collection.find({"active": {"$ne": False}, "stock": {"$lt": 20}})]
    total_profit = sum(b.get("profit", 0) for b in paid_bills)
    return {
        "total_bills":     len(paid_bills),
        "today_bills":     len(today_bills),
        "today_revenue":   round(sum(b["grand_total"] for b in today_bills), 2),
        "total_revenue":   round(sum(b["grand_total"] for b in paid_bills), 2),
        "total_profit":    round(total_profit, 2),
        "total_medicines": medicines_collection.count_documents({"active": {"$ne": False}}),
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock,
    }

@app.get("/dashboard/sales-report")
def sales_report(period: str = "daily", _: dict = Depends(get_current_user)):
    """period: daily | monthly"""
    paid_bills = list(bills_collection.find({"status": "paid"}))
    groups: dict = {}
    for b in paid_bills:
        dt  = b.get("created_at", "")[:10]
        key = dt[:7] if period == "monthly" else dt
        if key not in groups:
            groups[key] = {"period": key, "revenue": 0, "profit": 0, "bill_count": 0}
        groups[key]["revenue"]    += b.get("grand_total", 0)
        groups[key]["profit"]     += b.get("profit", 0)
        groups[key]["bill_count"] += 1
    result = sorted(groups.values(), key=lambda x: x["period"])
    for r in result:
        r["revenue"] = round(r["revenue"], 2)
        r["profit"]  = round(r["profit"],  2)
    return result

# uvicorn main:app --reload --port 8000