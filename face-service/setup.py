#!/usr/bin/env python3
"""
Setup script for HaduLMS Python Face Recognition Service
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("Error: Python 3.8 or higher is required")
        return False
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def check_cmake():
    """Check if CMake is installed."""
    try:
        result = subprocess.run(["cmake", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ CMake is installed")
            return True
    except FileNotFoundError:
        pass
    
    print("✗ CMake is not installed")
    if platform.system() == "Windows":
        print("Please install CMake from https://cmake.org/download/")
        print("Or use chocolatey: choco install cmake")
    elif platform.system() == "Darwin":  # macOS
        print("Install CMake using: brew install cmake")
    else:  # Linux
        print("Install CMake using your package manager:")
        print("Ubuntu/Debian: sudo apt-get install cmake")
        print("CentOS/RHEL: sudo yum install cmake")
    return False

def install_requirements():
    """Install Python requirements."""
    if not os.path.exists("requirements.txt"):
        print("✗ requirements.txt not found")
        return False
    
    return run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        "Installing Python requirements"
    )

def create_directories():
    """Create necessary directories."""
    dirs = ["face_encodings", "logs"]
    for dir_name in dirs:
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
            print(f"✓ Created directory: {dir_name}")
        else:
            print(f"✓ Directory already exists: {dir_name}")
    return True

def setup_environment():
    """Setup environment file."""
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("✓ Created .env file from .env.example")
        else:
            # Create basic .env file
            with open(".env", "w") as f:
                f.write("SERVICE_PORT=8001\n")
                f.write("HOST=0.0.0.0\n")
                f.write("CONFIDENCE_THRESHOLD=0.6\n")
                f.write("FACE_ENCODINGS_DIR=./face_encodings\n")
                f.write("DEBUG=true\n")
            print("✓ Created basic .env file")
    else:
        print("✓ .env file already exists")
    return True

def test_installation():
    """Test if the installation works."""
    print("\nTesting installation...")
    try:
        # Try importing required modules
        import cv2
        import face_recognition
        import fastapi
        import uvicorn
        print("✓ All required modules can be imported")
        
        # Test face_recognition with a simple operation
        import numpy as np
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        face_recognition.face_locations(test_image)
        print("✓ face_recognition module is working")
        
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def main():
    """Main setup function."""
    print("HaduLMS Python Face Recognition Service Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check CMake (required for dlib)
    if not check_cmake():
        print("\nPlease install CMake and run this setup script again.")
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        print("\nFailed to install requirements. Please check the error messages above.")
        sys.exit(1)
    
    # Test installation
    if not test_installation():
        print("\nInstallation test failed. Please check the error messages above.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✓ Setup completed successfully!")
    print("\nTo start the service, run:")
    print("  python main.py")
    print("\nOr for production:")
    print("  uvicorn main:app --host 0.0.0.0 --port 8001")
    print("\nThe service will be available at: http://localhost:8001")
    print("API documentation will be available at: http://localhost:8001/docs")

if __name__ == "__main__":
    main()