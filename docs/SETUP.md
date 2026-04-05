# Finova — Setup & Run Guide
## "Track less. Grow more."

---

## Prerequisites

| Tool      | Version | Download |
|-----------|---------|----------|
| Node.js   | 18+     | https://nodejs.org |
| Java JDK  | 17+     | https://adoptium.net |
| Maven     | 3.8+    | https://maven.apache.org |
| Python    | 3.10+   | https://python.org |
| MySQL     | 8.0+    | https://dev.mysql.com |

---

## Step 1 — MySQL Setup

```sql
-- In MySQL client / Workbench:
CREATE DATABASE finova;
```

Then run the schema:
```bash
mysql -u root -p finova < database/schema.sql
```

Creates all tables and one demo user:
- **Username:** `admin`
- **Password:** `admin123`

The admin user has **no profile** — on first login they will be redirected to onboarding.

---

## Step 2 — Backend (Spring Boot)

```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```

Starts at: **http://localhost:8080**

**If your MySQL password differs from `root123`**, edit:
```
backend/src/main/resources/application.properties
```
Change `spring.datasource.password=root123` to your password.

---

## Step 3 — AI Service (Python FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Starts at: **http://localhost:8001**

Interactive docs: **http://localhost:8001/docs**

> The AI service uses **zero random values** — all predictions are deterministic rule-based logic.

---

## Step 4 — Frontend (React)

```bash
cd frontend
npm install
npm start
```

Opens at: **http://localhost:3000**

Login: `admin` / `admin123`  
→ First login redirects to **onboarding** (6-step profile wizard)  
→ After onboarding: full personalised dashboard

---

## Architecture

```
Browser (React :3000)
    │
    ├── REST ──► Spring Boot (:8080)
    │                  │
    │                  ├── MySQL :3306 (users, transactions, investments, loans, user_profiles)
    │                  └── JWT authentication
    │
    └── AI ───► FastAPI (:8001)
                    ├── /predict-expense  → seasonal + category multiplier
                    ├── /simulate-future  → compound interest projection
                    └── /detect-fraud     → rule-based risk scoring
```

---

## API Reference

### Auth (Public)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | /api/auth/register | `{username, email, password}` |
| POST | /api/auth/login | `{username, password}` → `{token, profileComplete}` |

### User Profile (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/profile | Get onboarding data |
| POST | /api/user/profile | Save onboarding data |
| GET | /api/user/profile/status | `{complete: true/false}` |

### Transactions (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | All transactions |
| POST | /api/transactions | Add transaction |
| DELETE | /api/transactions/{id} | Delete transaction |
| GET | /api/transactions/summary | Dashboard totals |
| GET | /api/transactions/chart | 6-month chart data |
| GET | /api/transactions/avg-by-cat | Avg spend per category |

### Investments, Loans (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/DELETE | /api/investments | Manage investments |
| GET/POST/DELETE | /api/loans | Manage loans |
| POST | /api/loans/calculate-emi | EMI calculator |

---

## Key Design Principles

1. **No mock data** — backend returns empty arrays for new users
2. **No random values** — AI service uses deterministic rules only
3. **Profile-driven** — all modules read from `user_profiles` table
4. **Empty states** — every page shows helpful CTA when no data exists
5. **Real calculations** — tax, EMI, SIP, corpus are all mathematically correct

---

## Troubleshooting

**Backend won't start:**
- Check MySQL is running: `sudo service mysql start` (Linux) or start MySQL from MAMP/WAMP
- Verify DB name is `finova` in `application.properties`
- Java 17+ required: `java -version`

**Frontend shows empty dashboard:**
- Complete onboarding first (profile required for personalised data)
- Add transactions via the "Add Transaction" button

**AI service errors:**
- Ensure Python 3.10+: `python --version`
- Install deps: `pip install -r requirements.txt`
- The frontend falls back to rule-based logic if AI service is offline — it still works

---

*Finova v2.0 — Track less. Grow more.*
