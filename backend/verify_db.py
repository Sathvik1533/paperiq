import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

def check_cols(table):
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}';")
    print(f"--- {table.upper()} ---")
    for row in cur.fetchall():
        print(row[0])

check_cols("papers")
check_cols("questions")
cur.close()
conn.close()
