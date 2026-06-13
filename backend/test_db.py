import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres.kbwpahscrmxscrgolsmu:CMMANI%4002cm@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres")
    print("Connected via ap-southeast-1 on port 5432!")
    conn.close()
except Exception as e:
    print("ap-southeast-1 on port 5432 failed:", e)
