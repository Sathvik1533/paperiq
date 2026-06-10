import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
conn.autocommit = True
cur = conn.cursor()

cur.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preparation_level TEXT;")
print("Added preparation_level to user_profiles")

cur.close()
conn.close()
