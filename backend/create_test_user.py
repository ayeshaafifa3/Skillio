#!/usr/bin/env python
"""Create a test user for development."""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.utils.security import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

# Get DB session
db = SessionLocal()

try:
    # Check if test user exists
    existing = db.query(User).filter(User.email == "test@example.com").first()
    
    if existing:
        print("✓ Test user already exists")
        print(f"  Email: {existing.email}")
        print(f"  Name: {existing.name}")
    else:
        # Create test user
        test_user = User(
            name="Test User",
            email="test@example.com",
            password=hash_password("password123")
        )
        db.add(test_user)
        db.commit()
        print("✓ Test user created successfully!")
        print(f"  Email: test@example.com")
        print(f"  Password: password123")
        
finally:
    db.close()
