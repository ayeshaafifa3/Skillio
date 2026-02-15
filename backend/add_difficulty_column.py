#!/usr/bin/env python
"""Script to safely add the difficulty column to interview_sessions table."""

import sys
import os
from sqlalchemy import inspect, text

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine

def add_difficulty_column():
    """Add difficulty column to interview_sessions if it doesn't exist."""
    
    inspector = inspect(engine)
    
    # Check if table exists
    if 'interview_sessions' not in inspector.get_table_names():
        print("✗ Table 'interview_sessions' does not exist")
        return False
    
    # Get existing columns
    columns = [col['name'] for col in inspector.get_columns('interview_sessions')]
    print(f"Existing columns: {columns}")
    
    # Check if difficulty column already exists
    if 'difficulty' in columns:
        print("✓ 'difficulty' column already exists!")
        return True
    
    # Add the column
    print("\nAdding 'difficulty' column to interview_sessions...")
    try:
        with engine.connect() as connection:
            # Add column with default value
            connection.execute(text(
                "ALTER TABLE interview_sessions ADD COLUMN difficulty VARCHAR(20) DEFAULT 'beginner'"
            ))
            connection.commit()
        print("✓ Successfully added 'difficulty' column with default value 'beginner'")
        return True
    except Exception as e:
        print(f"✗ Error adding column: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Adding Difficulty Column to Interview Sessions")
    print("=" * 60)
    
    success = add_difficulty_column()
    
    if success:
        # Verify
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('interview_sessions')]
        print(f"\nUpdated columns: {columns}")
        if 'difficulty' in columns:
            print("\n✓ Migration successful! The 'difficulty' column is now available.")
        else:
            print("\n✗ Migration failed! Column not found.")
    else:
        print("\n✗ Migration failed!")
    
    print("=" * 60)
