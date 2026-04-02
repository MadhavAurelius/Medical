# ─── ADD THESE TO YOUR main.py ───────────────────────────────────────────────
#
# 1. Update MedicineCreate & MedicineUpdate models (replace existing ones)
# 2. Update seed_medicines() to include expiry_date
# 3. Add the new alert endpoints at the bottom
#
# ─────────────────────────────────────────────────────────────────────────────

# ── STEP 1: Replace your MedicineCreate model with this ──────────────────────
from pydantic import BaseModel
from typing import Optional
from db import medicines_collection
from fastapi import Depends, HTTPException, app
from auth import get_current_user  # Import from your auth module
class MedicineCreate(BaseModel):
    name: str
    price: float
    stock: int
    category: str
    expiry_date: Optional[str] = None   # ISO format: "YYYY-MM-DD"
    min_stock_threshold: Optional[int] = 20  # alert if stock drops below this

class MedicineUpdate(BaseModel):
    price: Optional[float] = None
    stock: Optional[int]   = None
    expiry_date: Optional[str] = None
    min_stock_threshold: Optional[int] = None


# ── STEP 2: Replace your seed_medicines() with this ──────────────────────────
def seed_medicines():
    if medicines_collection.count_documents({}) == 0:
        from datetime import datetime, timedelta
        today = datetime.now()
        medicines_collection.insert_many([
            {"id": "M001", "name": "Paracetamol 500mg",  "price": 2.50,  "stock": 200, "category": "Analgesic",      "expiry_date": (today + timedelta(days=400)).strftime("%Y-%m-%d"), "min_stock_threshold": 20},
            {"id": "M002", "name": "Amoxicillin 250mg",  "price": 8.00,  "stock": 150, "category": "Antibiotic",     "expiry_date": (today + timedelta(days=25)).strftime("%Y-%m-%d"),  "min_stock_threshold": 20},
            {"id": "M003", "name": "Cetrizine 10mg",     "price": 3.00,  "stock": 180, "category": "Antihistamine",  "expiry_date": (today + timedelta(days=10)).strftime("%Y-%m-%d"),  "min_stock_threshold": 20},
            {"id": "M004", "name": "Metformin 500mg",    "price": 5.50,  "stock": 120, "category": "Antidiabetic",   "expiry_date": (today + timedelta(days=60)).strftime("%Y-%m-%d"),  "min_stock_threshold": 20},
            {"id": "M005", "name": "Omeprazole 20mg",    "price": 6.00,  "stock": 160, "category": "Antacid",        "expiry_date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),   "min_stock_threshold": 20},  # already expired
            {"id": "M006", "name": "Vitamin C 500mg",    "price": 4.00,  "stock": 300, "category": "Supplement",     "expiry_date": (today + timedelta(days=200)).strftime("%Y-%m-%d"), "min_stock_threshold": 20},
            {"id": "M007", "name": "Aspirin 75mg",       "price": 1.50,  "stock": 15,  "category": "Analgesic",      "expiry_date": (today + timedelta(days=300)).strftime("%Y-%m-%d"), "min_stock_threshold": 20},  # low stock
            {"id": "M008", "name": "Azithromycin 500mg", "price": 12.00, "stock": 8,   "category": "Antibiotic",     "expiry_date": (today + timedelta(days=45)).strftime("%Y-%m-%d"),  "min_stock_threshold": 20},  # low stock
        ])


# ── STEP 3: Add these new endpoints to your app ──────────────────────────────

@app.get("/medicines/alerts/summary")
def get_alert_summary(_: dict = Depends(get_current_user)):
    """Returns counts for dashboard badge indicators."""
    from datetime import datetime, timedelta
    today     = datetime.now().date()
    soon_date = today + timedelta(days=90)

    all_meds = list(medicines_collection.find())
    expired, expiring_soon, low_stock = [], [], []

    for m in all_meds:
        m.pop("_id", None)
        exp = m.get("expiry_date")
        threshold = m.get("min_stock_threshold", 20)

        if exp:
            exp_date = datetime.strptime(exp, "%Y-%m-%d").date()
            if exp_date < today:
                expired.append(m)
            elif exp_date <= soon_date:
                days_left = (exp_date - today).days
                m["days_until_expiry"] = days_left
                expiring_soon.append(m)

        if m.get("stock", 0) < threshold:
            low_stock.append(m)

    return {
        "expired_count":       len(expired),
        "expiring_soon_count": len(expiring_soon),
        "low_stock_count":     len(low_stock),
        "total_alerts":        len(expired) + len(expiring_soon) + len(low_stock),
    }


@app.get("/medicines/alerts/expiry")
def get_expiry_alerts(days: int = 90, _: dict = Depends(get_current_user)):
    """
    Returns medicines expiring within `days` days (default 90) and already expired.
    Query param: ?days=30  (look-ahead window)
    """
    from datetime import datetime, timedelta
    today     = datetime.now().date()
    soon_date = today + timedelta(days=days)

    expired       = []
    expiring_soon = []

    for m in medicines_collection.find():
        m.pop("_id", None)
        exp = m.get("expiry_date")
        if not exp:
            continue
        try:
            exp_date = datetime.strptime(exp, "%Y-%m-%d").date()
        except ValueError:
            continue

        days_left = (exp_date - today).days

        if exp_date < today:
            m["days_until_expiry"] = days_left        # negative = already expired
            m["status"] = "expired"
            expired.append(m)
        elif exp_date <= soon_date:
            m["days_until_expiry"] = days_left
            m["status"] = "expiring_soon"
            expiring_soon.append(m)

    # Sort expiring_soon by most urgent first
    expiring_soon.sort(key=lambda x: x["days_until_expiry"])
    expired.sort(key=lambda x: x["days_until_expiry"])   # most recently expired first

    return {
        "look_ahead_days":     days,
        "expired":             expired,
        "expiring_soon":       expiring_soon,
        "expired_count":       len(expired),
        "expiring_soon_count": len(expiring_soon),
    }


@app.get("/medicines/alerts/low-stock")
def get_low_stock_alerts(_: dict = Depends(get_current_user)):
    """Returns medicines where stock < min_stock_threshold."""
    results = []
    for m in medicines_collection.find():
        m.pop("_id", None)
        threshold = m.get("min_stock_threshold", 20)
        if m.get("stock", 0) < threshold:
            m["shortage"] = threshold - m["stock"]
            results.append(m)
    results.sort(key=lambda x: x["stock"])   # most critical first
    return {
        "low_stock_count": len(results),
        "items": results,
    }


@app.patch("/medicines/{medicine_id}/threshold")
def update_threshold(medicine_id: str, threshold: int, _: dict = Depends(get_current_user)):
    """Update the min stock threshold for a specific medicine."""
    if not medicines_collection.find_one({"id": medicine_id}):
        raise HTTPException(status_code=404, detail="Medicine not found")
    medicines_collection.update_one({"id": medicine_id}, {"$set": {"min_stock_threshold": threshold}})
    medicine = medicines_collection.find_one({"id": medicine_id})
    medicine.pop("_id", None)
    return medicine
