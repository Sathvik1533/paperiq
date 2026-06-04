#!/usr/bin/env python3
"""
Test Knowledge Base Builder

Run this to manually test the automatic discovery system.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.jobs.knowledge_base_builder import (
    auto_build_mlrit_r22_knowledge_base,
    check_knowledge_base_exists,
)
from app.logger import get_logger

log = get_logger(__name__)


async def main():
    """Test knowledge base builder"""
    
    print("=" * 60)
    print("PaperIQ Knowledge Base Builder Test")
    print("=" * 60)
    print()
    
    # Step 1: Check if exists
    print("Step 1: Checking if knowledge base exists...")
    exists = await check_knowledge_base_exists("MLRIT", "R22")
    print(f"   Result: {'EXISTS' if exists else 'NOT FOUND'}")
    print()
    
    if exists:
        print("✓ Knowledge base already exists")
        print()
        print("To rebuild, delete subjects from database first:")
        print("  DELETE FROM subjects WHERE regulation = 'R22';")
        print()
        return
    
    # Step 2: Build knowledge base
    print("Step 2: Building knowledge base...")
    print("   This will:")
    print("   - Download MLRIT R22 syllabus PDF")
    print("   - Parse subjects and metadata")
    print("   - Create database records")
    print("   - Trigger paper discovery")
    print()
    
    try:
        result = await auto_build_mlrit_r22_knowledge_base()
        
        if result["success"]:
            print("✓ Knowledge base built successfully!")
            print()
            print("Summary:")
            print(f"  - College ID: {result['registry']['college_id']}")
            print(f"  - Branch ID: {result['registry']['branch_id']}")
            print(f"  - Regulation: {result['registry']['regulation']}")
            print(f"  - Subjects created: {result['registry']['subjects_created']}")
            print(f"  - Total subjects: {result['registry']['total_subjects']}")
            print()
            
            if result['paper_discovery']['success']:
                print(f"✓ Paper discovery started: Job {result['paper_discovery']['job_id']}")
            else:
                print(f"✗ Paper discovery failed: {result['paper_discovery'].get('error')}")
        else:
            print(f"✗ Knowledge base build failed: {result.get('error')}")
    
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
