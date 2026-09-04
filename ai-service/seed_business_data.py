"""
BusinessMind AI — Comprehensive Business Dataset Generator & Seeder
Populates businessmind_db with realistic multi-year enterprise sales records,
uploaded dataset audit logs, and synchronized RAG knowledge base documents.
"""

import uuid
import random
from datetime import datetime, date
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Anand@2005")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "businessmind_db")

# Catalog of enterprise products with category, base unit price, and cost percentage
CATALOG = [
    {"name": "Enterprise Cloud License", "category": "Software", "unit_price": 150000.0, "cost_pct": 0.32},
    {"name": "SaaS Annual Subscription", "category": "Software", "unit_price": 35000.0, "cost_pct": 0.25},
    {"name": "AI Predictive Analytics Suite", "category": "Enterprise AI", "unit_price": 220000.0, "cost_pct": 0.22},
    {"name": "Retail POS Terminal Unit", "category": "Hardware", "unit_price": 45000.0, "cost_pct": 0.68},
    {"name": "Server Rack Infrastructure Unit", "category": "Hardware", "unit_price": 85000.0, "cost_pct": 0.65},
    {"name": "B2B Strategic Consulting Package", "category": "Services", "unit_price": 180000.0, "cost_pct": 0.35},
    {"name": "CyberSecurity Compliance Audit", "category": "Services", "unit_price": 125000.0, "cost_pct": 0.40},
    {"name": "Dedicated Cloud DB Cluster", "category": "Cloud", "unit_price": 60000.0, "cost_pct": 0.30},
    {"name": "Customer Success Pro Care", "category": "Services", "unit_price": 25000.0, "cost_pct": 0.28},
    {"name": "Executive Analytics BI Seat", "category": "Software", "unit_price": 18000.0, "cost_pct": 0.20},
]

REGIONS = ["North America", "APAC", "EMEA", "Domestic", "Latin America"]

def generate_transactions():
    records = []
    random.seed(42)  # Deterministic seed for reproducible realistic data

    # Multipliers per month to simulate real-world seasonality (e.g. July dip, Q4 spike)
    # Month 1-12
    monthly_activity_weights_2024 = {
        1: 8, 2: 7, 3: 12, 4: 9, 5: 10, 6: 12,
        7: 6,   # July summer lull in 2024
        8: 10, 9: 11, 10: 14, 11: 15, 12: 18
    }

    monthly_activity_weights_2025 = {
        1: 10, 2: 9, 3: 15, 4: 11, 5: 13, 6: 16,
        7: 7,   # July summer budgeting lull in 2025
        8: 14, 9: 15, 10: 18, 11: 20, 12: 24
    }

    # Generate 2024 Transactions
    for month, count in monthly_activity_weights_2024.items():
        for _ in range(count):
            day = random.randint(1, 28)
            txn_date = date(2024, month, day)
            prod = random.choice(CATALOG)
            qty = random.randint(1, 8) if prod["category"] != "Software" else random.randint(3, 20)
            unit_p = prod["unit_price"]
            revenue = round(unit_p * qty, 2)
            cost = round(revenue * (prod["cost_pct"] + random.uniform(-0.03, 0.03)), 2)
            region = random.choice(REGIONS)
            records.append((
                str(uuid.uuid4()),
                None,
                txn_date.strftime("%Y-%m-%d"),
                prod["name"],
                prod["category"],
                qty,
                unit_p,
                revenue,
                cost,
                region
            ))

    # Generate 2025 Transactions
    for month, count in monthly_activity_weights_2025.items():
        for _ in range(count):
            day = random.randint(1, 28)
            txn_date = date(2025, month, day)
            prod = random.choice(CATALOG)
            qty = random.randint(1, 10) if prod["category"] != "Software" else random.randint(4, 25)
            unit_p = prod["unit_price"]
            revenue = round(unit_p * qty, 2)
            cost = round(revenue * (prod["cost_pct"] + random.uniform(-0.03, 0.03)), 2)
            region = random.choice(REGIONS)
            records.append((
                str(uuid.uuid4()),
                None,
                txn_date.strftime("%Y-%m-%d"),
                prod["name"],
                prod["category"],
                qty,
                unit_p,
                revenue,
                cost,
                region
            ))

    # Add 2026 Q1 Early Run-Rate Data
    for month in [1, 2]:
        for _ in range(12):
            day = random.randint(1, 28)
            txn_date = date(2026, month, day)
            prod = random.choice(CATALOG)
            qty = random.randint(2, 12)
            unit_p = prod["unit_price"]
            revenue = round(unit_p * qty, 2)
            cost = round(revenue * (prod["cost_pct"] + random.uniform(-0.03, 0.03)), 2)
            region = random.choice(REGIONS)
            records.append((
                str(uuid.uuid4()),
                None,
                txn_date.strftime("%Y-%m-%d"),
                prod["name"],
                prod["category"],
                qty,
                unit_p,
                revenue,
                cost,
                region
            ))

    return records

def seed():
    print(f"Connecting to MySQL ({MYSQL_HOST}:{MYSQL_PORT}) -> {MYSQL_DATABASE}...")
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset="utf8mb4",
        autocommit=True
    )

    with conn.cursor() as cur:
        # Clear existing demo sales records and replace with fresh comprehensive dataset
        print("Truncating old sales_records...")
        cur.execute("DELETE FROM sales_records;")

        records = generate_transactions()
        print(f"Inserting {len(records)} granular enterprise sales transactions (2024-2026)...")

        insert_sql = """
        INSERT INTO sales_records 
        (id, organization_id, transaction_date, product_name, category, quantity, unit_price, revenue, cost, customer_region)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cur.executemany(insert_sql, records)
        print(f"Successfully inserted {len(records)} sales records into database!")

        # Populate uploaded_datasets table
        cur.execute("DELETE FROM uploaded_datasets;")
        datasets = [
            (str(uuid.uuid4()), "FY2024_FY2025_Enterprise_Sales_Master.csv", "CSV", len(records), 1, None),
            (str(uuid.uuid4()), "Q3_Q4_Corporate_Margin_Profitability_Analysis.xlsx", "Excel", 145, 1, None),
            (str(uuid.uuid4()), "Customer_Retention_LTV_CAC_Playbook.csv", "CSV", 88, 1, None),
            (str(uuid.uuid4()), "Regional_APAC_NorthAmerica_Performance_Matrix.csv", "CSV", 120, 1, None)
        ]
        cur.executemany("""
        INSERT INTO uploaded_datasets (id, file_name, file_type, total_rows, indexed_in_rag, uploaded_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        """, datasets)
        print("Successfully populated uploaded_datasets catalog!")

        # Print summary
        cur.execute("SELECT COUNT(*) as total_txns, SUM(revenue) as total_rev, SUM(profit) as total_prof FROM sales_records;")
        summary = cur.fetchone()
        print(f"Total Transactions: {summary[0]}, Total Revenue: INR {summary[1]:,.2f}, Total Profit: INR {summary[2]:,.2f}")

    conn.close()

if __name__ == "__main__":
    seed()
