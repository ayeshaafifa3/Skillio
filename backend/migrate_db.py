#!/usr/bin/env python
"""Script to drop and recreate interview tables."""

import sys
import os
from sqlalchemy import inspect

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, engine
from app.models.chat_history import InterviewSession, InterviewMessage

# Get inspector to check what exists
inspector = inspect(engine)

# Drop old tables if they exist
tables_to_drop = ['interview_sessions', 'interview_messages']
for table_name in tables_to_drop:
    if table_name in inspector.get_table_names():
        print(f"Dropping old table: {table_name}")
        Base.metadata.tables[table_name].drop(engine)
        print(f"✓ Dropped {table_name}")

# Now create all tables fresh
print("\nCreating tables with new schema...")
Base.metadata.create_all(bind=engine)
print("✓ Tables created successfully")

# Verify
inspector = inspect(engine)
if "interview_sessions" in inspector.get_table_names():
    columns = [col['name'] for col in inspector.get_columns('interview_sessions')]
    print(f"\ninterview_sessions columns: {columns}")
    if "mode" in columns:
        print("✓ SUCCESS: 'mode' column exists!")
    else:
        print("✗ FAILED: 'mode' column not found!")
