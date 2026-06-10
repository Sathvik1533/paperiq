"""
Migration runner — tracks applied migrations and runs pending ones.
Uses a simple `schema_migrations` table in Supabase.
"""
import os
import glob
from app.database import get_admin_db
from app.logger import get_logger

log = get_logger(__name__)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'supabase', 'migrations')

def ensure_migrations_table(db):
    """Create schema_migrations table if it doesn't exist."""
    # This is done via Supabase SQL editor or a bootstrap migration
    pass

def get_applied_migrations(db) -> set:
    """Get set of already-applied migration filenames."""
    try:
        result = db.table("schema_migrations").select("version").execute()
        return {r["version"] for r in (result.data or [])}
    except Exception:
        return set()

def get_pending_migrations(applied: set) -> list:
    """Get sorted list of unapplied migration files."""
    pattern = os.path.join(MIGRATIONS_DIR, "*.sql")
    files = sorted(glob.glob(pattern))
    pending = []
    for f in files:
        name = os.path.basename(f)
        if name not in applied:
            pending.append((name, f))
    return pending

def record_migration(db, version: str):
    """Record a migration as applied."""
    db.table("schema_migrations").insert({"version": version}).execute()

def run_migrations():
    """Run all pending migrations. Returns summary."""
    db = get_admin_db()
    applied = get_applied_migrations(db)
    pending = get_pending_migrations(applied)

    if not pending:
        return {"applied": 0, "message": "All migrations up to date"}

    results = []
    for name, path in pending:
        try:
            with open(path) as f:
                sql = f.read()
            # Execute via Supabase RPC or raw query
            db.rpc("exec_sql", {"query": sql}).execute()
            record_migration(db, name)
            results.append({"migration": name, "status": "applied"})
            log.info(f"Applied migration: {name}")
        except Exception as e:
            results.append({"migration": name, "status": "failed", "error": str(e)})
            log.error(f"Failed migration {name}: {e}")
            break  # Stop on first failure

    return {"applied": len([r for r in results if r["status"] == "applied"]), "results": results}

def migration_status():
    """Get current migration status without running anything."""
    db = get_admin_db()
    applied = get_applied_migrations(db)
    pending = get_pending_migrations(applied)
    return {
        "applied": sorted(applied),
        "pending": [name for name, _ in pending],
        "total_applied": len(applied),
        "total_pending": len(pending),
    }
