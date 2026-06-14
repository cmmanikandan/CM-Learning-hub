import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('DATABASE_URL')
print("Testing DATABASE_URL:", db_url)
try:
    conn = psycopg2.connect(db_url)
    print("Successfully connected to the database!")
    conn.close()
except Exception as e:
    print("Database connection failed:", e)
