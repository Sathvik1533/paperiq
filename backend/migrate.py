#!/usr/bin/env python3
"""CLI for running migrations. Usage: python migrate.py [status|run]"""
import sys
import json
from app.migrations import run_migrations, migration_status

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"

    if cmd == "status":
        result = migration_status()
        print(json.dumps(result, indent=2))
    elif cmd == "run":
        result = run_migrations()
        print(json.dumps(result, indent=2))
    else:
        print(f"Usage: python migrate.py [status|run]")
        sys.exit(1)

if __name__ == "__main__":
    main()
