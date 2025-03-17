#!/bin/bash

# Check if a Python script was provided as an argument
if [ $# -eq 0 ]; then
    echo "Error: No Python script specified."
    echo "Usage: $0 <python_script.py> [additional_scripts...]"
    exit 1
fi

# Create a new virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Run the provided Python scripts
for script in "$@"; do
    echo "Running $script..."
    python3 "$script"
done

# Deactivate the virtual environment
# echo "Deactivating virtual environment..."
# deactivate

echo "Done!"
