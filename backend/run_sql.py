import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

with open("../supabase/migrations/009_visual_context_and_storage.sql", "r") as f:
    sql = f.read()

cur.execute(sql)
print("009 Migration Executed Successfully")
cur.close()
conn.close()
