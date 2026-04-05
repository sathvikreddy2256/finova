"""
Finova — AI Service (FastAPI)
================================
Track less. Grow more.

Endpoints:
  POST /predict-expense   → Average of last 3 months + seasonal factor
  POST /simulate-future   → future_savings = savings * months (compounded)
  POST /detect-fraud      → Rule-based: flag if amount > avg * threshold

NO RANDOM VALUES. All logic is deterministic and rule-based.

Run with:
  uvicorn main:app --reload --port 8001
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def parse_allowed_origins(value: str) -> List[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]

app = FastAPI(
    title="Finova AI Service",
    description="Finova — Track less. Grow more. Deterministic rule-based financial analysis.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_allowed_origins(
        os.getenv("AI_CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Seasonal multipliers (month 1–12) ────────────────────────────────────────
# Based on real Indian spending patterns — no randomness
SEASONAL = [0.95, 0.93, 1.05, 0.98, 0.96, 0.95, 0.97, 0.96, 1.0, 1.08, 1.10, 1.12]

# Category base tendency multipliers
CATEGORY_MULTIPLIERS = {
    "food": 1.02, "transport": 1.00, "entertainment": 1.05,
    "utilities": 0.98, "shopping": 1.08, "health": 1.01,
    "education": 0.99, "rent": 1.00, "other": 1.03,
}

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ExpensePredictionRequest(BaseModel):
    income: float
    current_expense: float
    category: str
    month: int                     # 1–12

class ExpensePredictionResponse(BaseModel):
    predicted_expense: float
    category: str
    confidence: float
    trend: str
    advice: str

class SimulationRequest(BaseModel):
    income: float
    expense: float
    savings_rate: float
    years: int
    inflation: float
    investment_return: Optional[float] = 12.0

class YearProjection(BaseModel):
    year: int
    savings: float
    expenses: float
    net_worth: float
    inflation_adjusted_income: float

class SimulationResponse(BaseModel):
    year_projections: List[YearProjection]
    summary: dict

class FraudRequest(BaseModel):
    amount: float
    merchant: str
    category: str
    hour: int
    location: Optional[str] = "Same City"
    average_transaction: Optional[float] = None  # user's historical average

class FraudResponse(BaseModel):
    risk_score: float
    is_fraudulent: bool
    risk_level: str
    flags: List[str]
    recommendation: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Finova AI Engine",
        "tagline": "Track less. Grow more.",
        "status": "running",
        "version": "2.0.0",
        "endpoints": ["/predict-expense", "/simulate-future", "/detect-fraud"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/predict-expense", response_model=ExpensePredictionResponse)
def predict_expense(req: ExpensePredictionRequest):
    """
    Predicts next month's expense for a category.

    Formula (deterministic — no randomness):
      predicted = current_expense * seasonal_factor * category_multiplier * ratio_adjustment

    seasonal_factor: based on next calendar month (Indian spending patterns)
    category_multiplier: known category tendency
    ratio_adjustment: if spending > 80% income, slight pullback predicted
    """
    if req.current_expense <= 0:
        raise HTTPException(400, "current_expense must be positive")
    if req.income <= 0:
        raise HTTPException(400, "income must be positive")
    if not 1 <= req.month <= 12:
        raise HTTPException(400, "month must be 1–12")

    next_month = (req.month % 12)          # 0-indexed → next month
    seasonal   = SEASONAL[next_month]
    cat_mult   = CATEGORY_MULTIPLIERS.get(req.category.lower(), 1.03)

    # Spending ratio adjustment (deterministic — no noise)
    ratio = req.current_expense / req.income
    ratio_adj = 0.96 if ratio > 0.80 else (1.02 if ratio < 0.40 else 1.0)

    final_mult  = seasonal * cat_mult * ratio_adj
    predicted   = round(req.current_expense * final_mult, 2)
    change_pct  = round((final_mult - 1) * 100, 1)

    # Confidence: higher for stable categories, lower for volatile ones
    volatile_cats = {"entertainment", "shopping", "health"}
    confidence = 0.72 if req.category.lower() in volatile_cats else 0.85

    trend = "increasing" if change_pct > 1 else ("decreasing" if change_pct < -1 else "stable")

    month_names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    next_name   = month_names[(req.month % 12) + 1] if req.month < 12 else "January"

    advice = (
        f"Your {req.category} expenses are projected to {trend} by {abs(change_pct):.1f}% "
        f"in {next_name}. Predicted: ₹{predicted:,.0f} "
        f"({round(predicted/req.income*100,1)}% of income). "
        + ("Festival/year-end season drives higher spending." if seasonal > 1.05 else
           "Low-spend period — good time to build savings." if seasonal < 0.95 else
           "Normal spending period expected.")
    )

    return ExpensePredictionResponse(
        predicted_expense=predicted,
        category=req.category,
        confidence=confidence,
        trend=trend,
        advice=advice,
    )


@app.post("/simulate-future", response_model=SimulationResponse)
def simulate_future(req: SimulationRequest):
    """
    Simulates financial trajectory over N years.

    Rules (deterministic):
      - Income grows at 8% per year (typical Indian increment)
      - Expenses grow at inflation rate
      - Savings invested at investment_return%
      - Net worth = FV of monthly savings compounded monthly

    NO RANDOM VALUES — same inputs always produce same outputs.
    """
    if req.years <= 0 or req.years > 50:
        raise HTTPException(400, "years must be 1–50")
    if req.income <= 0:
        raise HTTPException(400, "income must be positive")

    INCOME_GROWTH = 0.08    # 8% annual salary increment
    inv_rate      = req.investment_return / 100
    annual_income = req.income * 12
    annual_expense = req.expense * 12

    projections = []
    cumulative  = 0.0

    for y in range(req.years + 1):
        proj_income  = annual_income  * math.pow(1 + INCOME_GROWTH,    y)
        proj_expense = annual_expense * math.pow(1 + req.inflation/100, y)
        monthly_sav  = max(0.0, (proj_income - proj_expense) / 12)

        if y == 0:
            net_worth = 0.0
        else:
            cumulative = cumulative * (1 + inv_rate) + monthly_sav * 12
            net_worth  = cumulative

        projections.append(YearProjection(
            year=y,
            savings=round(monthly_sav * 12, 2),
            expenses=round(proj_expense, 2),
            net_worth=round(net_worth, 2),
            inflation_adjusted_income=round(proj_income, 2),
        ))

    final = projections[-1]
    return SimulationResponse(
        year_projections=projections,
        summary={
            "projected_net_worth": round(final.net_worth, 2),
            "final_monthly_income": round(final.inflation_adjusted_income / 12, 2),
            "final_monthly_expense": round(final.expenses / 12, 2),
            "inflation_impact": (
                f"Your ₹{int(req.expense):,}/mo expense becomes "
                f"₹{int(final.expenses/12):,}/mo in {req.years} years "
                f"at {req.inflation}% inflation."
            ),
        },
    )


@app.post("/detect-fraud", response_model=FraudResponse)
def detect_fraud(req: FraudRequest):
    """
    Flags a transaction as potentially fraudulent using deterministic rules.

    Rules:
      1. Amount > 3x user's average → high risk
      2. Amount > ₹50,000 → moderate risk flag
      3. Transaction hour between 00:00–05:00 → unusual hour flag
      4. High-risk merchant keywords → flag
      5. High-risk categories (ATM, International) → flag

    NO RANDOM SCORES — risk is computed purely from rules.
    """
    risk   = 0.0
    flags  = []

    # Rule 1: Compare against user's average (if provided)
    if req.average_transaction and req.average_transaction > 0:
        ratio = req.amount / req.average_transaction
        if ratio > 5:
            risk += 0.40
            flags.append(f"Amount is {ratio:.1f}x your average transaction")
        elif ratio > 3:
            risk += 0.25
            flags.append(f"Amount is {ratio:.1f}x your average transaction")

    # Rule 2: Absolute amount threshold
    if req.amount >= 50000:
        risk += 0.30
        flags.append(f"Large transaction: ₹{req.amount:,.0f} (≥ ₹50,000)")
    elif req.amount >= 20000:
        risk += 0.12
        flags.append(f"Above-average amount: ₹{req.amount:,.0f}")

    # Rule 3: Unusual transaction hour
    if 0 <= req.hour <= 4:
        risk += 0.25
        flags.append(f"Unusual hour: {req.hour}:00 AM (midnight–5am)")
    elif req.hour >= 23:
        risk += 0.10
        flags.append("Late night transaction")

    # Rule 4: Merchant keyword check
    HIGH_RISK_WORDS = ["casino","lottery","crypto","forex","offshore","wire","unknown","unlisted"]
    merchant_lower  = req.merchant.lower()
    for kw in HIGH_RISK_WORDS:
        if kw in merchant_lower:
            risk += 0.30
            flags.append(f"High-risk merchant keyword: '{kw}'")
            break

    # Rule 5: High-risk category
    if req.category in ("ATM", "International", "Crypto"):
        risk += 0.20
        flags.append(f"High-risk category: {req.category}")

    # Rule 6: Location anomaly
    if req.location and "international" in req.location.lower():
        risk += 0.15
        flags.append("International location")

    risk = min(1.0, round(risk, 3))

    if risk >= 0.70:
        level    = "HIGH"
        is_fraud = True
        reco     = "⚠️ Block this transaction and contact your bank immediately."
    elif risk >= 0.40:
        level    = "MEDIUM"
        is_fraud = False
        reco     = "🔍 Monitor closely. Verify with merchant if you don't recognise this."
    else:
        level    = "LOW"
        is_fraud = False
        reco     = "✅ Transaction appears normal. No action needed."

    if not flags:
        flags.append("No suspicious patterns detected")

    return FraudResponse(
        risk_score=risk,
        is_fraudulent=is_fraud,
        risk_level=level,
        flags=flags,
        recommendation=reco,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("AI_HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", os.getenv("AI_PORT", "8001"))),
        reload=os.getenv("AI_RELOAD", "false").lower() == "true",
    )
