import shutil
import csv
import os


def copy_file(src, dst):
    """Copy a file from src to dst."""
    try:
        shutil.copy(src, dst)
    except Exception as e:
        print(f"Error copying file from {src} to {dst}: {e}")


def copy_file_with_name(src, dst):
    """Copy a file from src to dst with the same name."""
    try:
        shutil.copy(src, dst)  # Use shutil for cross-platform compatibility
    except Exception as e:
        print(f"Error copying file with name from {src} to {dst}: {e}")


def read_csv(file_path):
    """Read the first row of a CSV file and return it as a dictionary."""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return None

    try:
        with open(file_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            data = next(reader)  # Get the first row
            return data
    except Exception as e:
        print(f"Error reading CSV file {file_path}: {e}")
        return None
