#!/usr/bin/env python3
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables from .env.secrets
load_dotenv('.env.secrets')

def send_simple_message():
    api_key = os.getenv('MAILGUN_API')
    
    if not api_key:
        print("Error: MAILGUN_API not found in .env.secrets")
        return False
    
    try:
        response = requests.post(
            "https://api.mailgun.net/v3/sandboxad2ef991cd4643e990f0338482f1cb90.mailgun.org/messages",
            auth=("api", api_key),
            data={
                "from": "Mailgun Sandbox <postmaster@sandboxad2ef991cd4643e990f0338482f1cb90.mailgun.org>",
                "to": "tianzhi chen <burgesschen1990@gmail.com>",
                "subject": "Hello tianzhi chen",
                "text": "Congratulations tianzhi chen, you just sent an email with Mailgun! You are truly awesome!"
            }
        )
        
        if response.status_code == 200:
            print("Email sent successfully!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"Failed to send email. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

if __name__ == "__main__":
    success = send_simple_message()
    sys.exit(0 if success else 1)