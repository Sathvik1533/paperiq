import asyncio
from app.database import get_admin_db

async def main():
    db = get_admin_db()
    try:
        # Check if max_marks exists by doing a select
        res = db.table("papers").select("max_marks").limit(1).execute()
        print("max_marks exists:", res.data)
    except Exception as e:
        print("max_marks does not exist:", e)

if __name__ == "__main__":
    asyncio.run(main())
