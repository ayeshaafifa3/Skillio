#!/usr/bin/env python
"""Test script to verify database setup."""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

# Import database to trigger schema creation
from app.database import Base, engine
from app.models.chat_history import InterviewSession

print("✓ Models imported successfully")

# Print InterviewSession columns
print("\nInterviewSession columns:")
for column in InterviewSession.__table__.columns:
    print(f"  - {column.name}: {column.type}")

# Create all tables
Base.metadata.create_all(bind=engine)
print("\n✓ Database tables created successfully")

# Verify the table exists
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables in database: {tables}")

if "interview_sessions" in tables:
    columns = [col['name'] for col in inspector.get_columns('interview_sessions')]
    print(f"interview_sessions columns: {columns}")
    
    if "mode" in columns:
        print("✓ 'mode' column found!")
    else:
        print("✗ 'mode' column NOT found!")
else:
    print("✗ interview_sessions table not found!")
