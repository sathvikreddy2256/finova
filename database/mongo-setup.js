// ============================================================
// Finova — MongoDB Setup Script
// ============================================================
// Run with: mongosh < database/mongo-setup.js
// Or paste into MongoDB Compass shell
// ============================================================

// Switch to (or create) finova_logs database
use finova_logs;

// ─── AI Predictions collection ─────────────────────────────
db.createCollection("predictions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "input", "output", "createdAt"],
      properties: {
        userId:    { bsonType: "string",  description: "User ID from MySQL" },
        type:      { bsonType: "string",  description: "predict-expense | simulate-future | detect-fraud" },
        input:     { bsonType: "object",  description: "Request payload" },
        output:    { bsonType: "object",  description: "AI response payload" },
        createdAt: { bsonType: "date",    description: "Timestamp" }
      }
    }
  }
});

// ─── Activity Logs collection ──────────────────────────────
db.createCollection("activity_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "action", "timestamp"],
      properties: {
        userId:    { bsonType: "string" },
        action:    { bsonType: "string" },
        details:   { bsonType: "object" },
        ipAddress: { bsonType: "string" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

// ─── Indexes ────────────────────────────────────────────────
db.predictions.createIndex({ userId: 1, createdAt: -1 });
db.predictions.createIndex({ type: 1 });
db.activity_logs.createIndex({ userId: 1, timestamp: -1 });

// ─── Sample prediction document ────────────────────────────
db.predictions.insertOne({
  userId: "1",
  type: "predict-expense",
  input: {
    income: 92000,
    current_expense: 58000,
    category: "food",
    month: 3
  },
  output: {
    predicted_expense: 60320,
    confidence: 0.82,
    trend: "increasing",
    advice: "Festival season approaching — food costs expected to rise."
  },
  createdAt: new Date()
});

print("MongoDB setup complete!");
print("Collections: predictions, activity_logs");
