import psycopg2
import concurrent.futures

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
    "ap-southeast-1", "ap-southeast-2", "ap-south-1",
    "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-north-1", "sa-east-1"
]

def test_region(region):
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres.kbwpahscrmxscrgolsmu",
            password="CMMANI@02cm",
            host=host,
            port=6543,
            connect_timeout=3
        )
        print(f"SUCCESS: Connected to {region}!")
        conn.close()
        return region, "success"
    except Exception as e:
        err_msg = str(e).strip()
        if "tenant/user postgres.kbwpahscrmxscrgolsmu not found" in err_msg:
            return region, "not_found"
        else:
            print(f"Region {region} ({host}) returned other error: {err_msg}")
            return region, "other"

print("Starting region scan...")
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(test_region, regions))

for region, status in results:
    if status != "not_found":
        print(f"-> {region}: {status}")
