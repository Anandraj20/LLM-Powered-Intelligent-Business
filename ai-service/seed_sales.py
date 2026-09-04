"""
Seed script — inserts 50 sample sales records into businessmind_db.sales_records.
Run once: python seed_sales.py
"""
import pymysql
import uuid
import random
from datetime import date, timedelta

CONN = dict(
    host="localhost", port=3306, user="root",
    password="Anand@2005", database="businessmind_db",
    charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor
)

PRODUCTS = [
    ("AI Analytics Suite", "Software"),
    ("BusinessMind Pro", "Software"),
    ("BI Dashboard Module", "Software"),
    ("Enterprise CRM", "Software"),
    ("Inventory Manager", "Software"),
    ("Laptop Pro 16", "Hardware"),
    ("Workstation X", "Hardware"),
    ("Office Chair Ergonomic", "Furniture"),
    ("Standing Desk Premium", "Furniture"),
    ("Marketing Campaign Q3", "Services"),
    ("Consulting Hours", "Services"),
    ("Cloud Storage 1TB", "Cloud"),
]

REGIONS = ["North America", "Europe", "APAC", "South Asia", "Middle East", "Latin America"]

conn = pymysql.connect(**CONN)
inserted = 0

with conn:
    with conn.cursor() as cursor:
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) AS cnt FROM sales_records")
        existing = cursor.fetchone()["cnt"]
        if existing >= 50:
            print(f"[Seed] Already have {existing} records — skipping insert.")
        else:
            for i in range(60):
                product, category = random.choice(PRODUCTS)
                qty = random.randint(1, 20)
                unit_price = round(random.uniform(1500, 85000), 2)
                revenue = round(qty * unit_price, 2)
                cost = round(revenue * random.uniform(0.45, 0.72), 2)
                txn_date = date(2025, 1, 1) + timedelta(days=random.randint(0, 364))
                region = random.choice(REGIONS)

                cursor.execute("""
                    INSERT INTO sales_records
                        (id, transaction_date, product_name, category, quantity,
                         unit_price, revenue, cost, customer_region)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), txn_date, product, category,
                    qty, unit_price, revenue, cost, region
                ))
                inserted += 1

            conn.commit()
            print(f"[Seed] OK: Inserted {inserted} sales records into businessmind_db.sales_records")


print("[Seed] Done.")
