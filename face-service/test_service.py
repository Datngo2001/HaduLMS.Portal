#!/usr/bin/env python3
"""
Test script for HaduLMS Python Face Recognition Service
"""

import requests
import base64
import json
import os
import sys
from PIL import Image, ImageDraw
import numpy as np

SERVICE_URL = "http://localhost:8001"

def create_test_image(name: str) -> str:
    """Create a simple test image with text."""
    # Create a simple image with colored background
    img = Image.new('RGB', (200, 200), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Add text to make images different
    draw.text((10, 10), f"Test User\n{name}", fill='black')
    
    # Convert to base64
    from io import BytesIO
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_str}"

def test_health_check():
    """Test the health check endpoint."""
    print("Testing health check...")
    try:
        response = requests.get(f"{SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health check passed: {data['status']}")
            print(f"  Registered users: {data['registered_users_count']}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Health check error: {e}")
        return False

def test_register_face(user_id: str, image_b64: str):
    """Test face registration."""
    print(f"Testing face registration for user: {user_id}")
    try:
        payload = {
            "user_id": user_id,
            "image": image_b64
        }
        response = requests.post(f"{SERVICE_URL}/register-face", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"✓ Face registered successfully for user: {user_id}")
                return True
            else:
                print(f"✗ Face registration failed: {data['message']}")
                return False
        else:
            print(f"✗ Face registration failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Face registration error: {e}")
        return False

def test_identify_face(image_b64: str, expected_user_id: str = None):
    """Test face identification."""
    print("Testing face identification...")
    try:
        payload = {
            "image": image_b64
        }
        response = requests.post(f"{SERVICE_URL}/identify-face", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                user_id = data['user_id']
                confidence = data['confidence']
                print(f"✓ Face identified as: {user_id} (confidence: {confidence:.3f})")
                
                if expected_user_id and user_id == expected_user_id:
                    print("✓ Identification matches expected user")
                    return True
                elif expected_user_id:
                    print(f"✗ Expected {expected_user_id}, got {user_id}")
                    return False
                return True
            else:
                print(f"✗ Face identification failed: {data['message']}")
                return False
        else:
            print(f"✗ Face identification failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Face identification error: {e}")
        return False

def test_delete_face(user_id: str):
    """Test face deletion."""
    print(f"Testing face deletion for user: {user_id}")
    try:
        response = requests.delete(f"{SERVICE_URL}/delete-face/{user_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"✓ Face deleted successfully for user: {user_id}")
                return True
            else:
                print(f"✗ Face deletion failed: {data['message']}")
                return False
        else:
            print(f"✗ Face deletion failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Face deletion error: {e}")
        return False

def test_registered_users():
    """Test getting registered users."""
    print("Testing registered users endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/registered-users")
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                users = data['users']
                count = data['count']
                print(f"✓ Retrieved {count} registered users: {users}")
                return users
            else:
                print("✗ Failed to get registered users")
                return []
        else:
            print(f"✗ Get registered users failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"✗ Get registered users error: {e}")
        return []

def run_comprehensive_test():
    """Run a comprehensive test of the service."""
    print("HaduLMS Python Face Recognition Service Test")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("Service is not healthy, stopping tests")
        return False
    
    print()
    
    # Test 2: Create test images
    print("Creating test images...")
    test_users = {
        "user1": create_test_image("User 1"),
        "user2": create_test_image("User 2"),
        "user3": create_test_image("User 3")
    }
    print("✓ Test images created")
    
    print()
    
    # Test 3: Register faces
    registration_success = True
    for user_id, image in test_users.items():
        if not test_register_face(user_id, image):
            registration_success = False
    
    if not registration_success:
        print("Some registrations failed, continuing with tests...")
    
    print()
    
    # Test 4: Check registered users
    registered_users = test_registered_users()
    
    print()
    
    # Test 5: Identify faces
    identification_success = True
    for user_id, image in test_users.items():
        if user_id in registered_users:
            if not test_identify_face(image, user_id):
                identification_success = False
    
    print()
    
    # Test 6: Clean up - delete faces
    print("Cleaning up test data...")
    for user_id in registered_users:
        if user_id.startswith("user"):  # Only delete test users
            test_delete_face(user_id)
    
    print()
    print("=" * 50)
    if registration_success and identification_success:
        print("✓ All tests passed!")
        return True
    else:
        print("✗ Some tests failed")
        return False

def main():
    """Main test function."""
    if len(sys.argv) > 1:
        if sys.argv[1] == "health":
            test_health_check()
        elif sys.argv[1] == "users":
            test_registered_users()
        else:
            print("Usage: python test_service.py [health|users]")
    else:
        run_comprehensive_test()

if __name__ == "__main__":
    main()