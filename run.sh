#!/bin/bash

# Create a new virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Run the geo_search.py script
echo "Running geo_search.py..."
python geo_search.py

# Deactivate the virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "Done!"
