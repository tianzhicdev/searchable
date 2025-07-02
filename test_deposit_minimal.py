#!/usr/bin/env python3
import requests
import json

# Create user
username = "minimal_test"
email = f"{username}@test.com"
password = "test123"

# Register
reg_resp = requests.post(
    "http://localhost:5005/api/users/register",
    json={"username": username, "email": email, "password": password}
)
print(f"Register: {reg_resp.status_code}")

# Login
login_resp = requests.post(
    "http://localhost:5005/api/users/login",
    json={"email": email, "password": password}
)
print(f"Login: {login_resp.status_code}")
login_data = login_resp.json()
print(f"Login response: {json.dumps(login_data, indent=2)}")

token = login_data.get("token")
print(f"\nToken: {token}")

# Try deposit
headers = {"Authorization": token, "Content-Type": "application/json"}
deposit_data = {"amount": "10.00"}

print(f"\nSending deposit request...")
print(f"Headers: {headers}")
print(f"Data: {deposit_data}")

deposit_resp = requests.post(
    "http://localhost:5005/api/v1/deposit/create",
    headers=headers,
    json=deposit_data
)

print(f"\nDeposit response status: {deposit_resp.status_code}")
print(f"Deposit response: {deposit_resp.text}")