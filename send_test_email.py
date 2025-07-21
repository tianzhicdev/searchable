#!/usr/bin/env python3
import os
import sys
import requests

def send_simple_message():
    # Check if brand parameter is provided
    brand = sys.argv[1] if len(sys.argv) > 1 else "default"
    
    # Read the marketing image
    image_path = os.path.join(os.path.dirname(__file__), "marketing", "email_pic1.png")
    if not os.path.exists(image_path):
        print(f"Warning: Marketing image not found at {image_path}")
        print("Sending text-only email instead")
        image_data = None
    else:
        with open(image_path, "rb") as f:
            image_data = f.read()
    
    if brand == "abitchaotic":
        # Match the Java implementation exactly
        api_key = os.getenv('API_KEY')
        if api_key is None:
            api_key = 'API_KEY'
        
        # HTML content with clickable image using cid reference
        html_content = """
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="margin-bottom: 20px; color: #333;">
                    <h2 style="color: #333; margin-bottom: 10px;">You are invited to join abitchaotic!</h2>
                    <p style="line-height: 1.6; margin-bottom: 15px;">
                        Here you can monetize your digital content freely for USDT. We offer the lowest fees on the planet — 1% with no-KYC. 
                        We convert the buyers' USD to USDT for you.
                    </p>
                    <p style="line-height: 1.6; margin-bottom: 20px;">
                        Click below to join abitchaotic.com right now!
                    </p>
                </div>
                <a href="https://abitchaotic.com" target="_blank" style="display: block;">
                    <img src="cid:email_pic1" alt="Join abitchaotic.com" style="width: 100%; max-width: 600px; height: auto; display: block;">
                </a>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                    <p>Have a question? Contact <a href="mailto:info@abitchaotic.com" style="color: #4a90e2;">info@abitchaotic.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Prepare the request data
        data = {
            "from": "abitchaotic <info@abitchaotic.com>",
            "to": "tianzhi chen <tianzhic.dev@gmail.com>",
            "subject": "You're invited to join abitchaotic - Monetize your content for USDT",
            "text": "You are invited to join abitchaotic! Here you can monetize your digital content freely for USDT. We offer the lowest fees on the planet — 1% with no-KYC. Visit abitchaotic.com for more information!",
            "html": html_content
        }
        
        # Send with inline image if available
        if image_data:
            files = [("inline", ("email_pic1", image_data, "image/png"))]
            return requests.post(
                "https://api.mailgun.net/v3/sandbox40099185e5954b6c884f2ae7bc6c5a72.mailgun.org/messages",
                auth=("api", api_key),
                data=data,
                files=files
            )
        else:
            return requests.post(
                "https://api.mailgun.net/v3/sandbox40099185e5954b6c884f2ae7bc6c5a72.mailgun.org/messages",
                auth=("api", api_key),
                data=data
            )
    else:
        # Default (eccentricprotocol)
        # HTML content with clickable image using cid reference
        html_content = """
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="margin-bottom: 20px; color: #333;">
                    <h2 style="color: #333; margin-bottom: 10px;">You are invited to join Eccentric Protocol!</h2>
                    <p style="line-height: 1.6; margin-bottom: 15px;">
                        Here you can monetize your digital content freely for USDT. We offer the lowest fees on the planet — 1% with no-KYC. 
                        We convert the buyers' USD to USDT for you.
                    </p>
                    <p style="line-height: 1.6; margin-bottom: 20px;">
                        Click below to join eccentricprotocol.com right now!
                    </p>
                </div>
                <a href="https://eccentricprotocol.com" target="_blank" style="display: block;">
                    <img src="cid:email_pic1" alt="Join eccentricprotocol.com" style="width: 100%; max-width: 600px; height: auto; display: block;">
                </a>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                    <p>Have a question? Contact <a href="mailto:info@eccentricprotocol.com" style="color: #4a90e2;">info@eccentricprotocol.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Prepare the request data
        data = {
            "from": "Eccentric Protocol <info@eccentricprotocol.com>",
            "to": "tianzhi chen <burgesschen1990@gmail.com>",
            "subject": "You're invited to join Eccentric Protocol - Monetize your content for USDT",
            "text": "You are invited to join Eccentric Protocol! Here you can monetize your digital content freely for USDT. We offer the lowest fees on the planet — 1% with no-KYC. Visit eccentricprotocol.com for more information!",
            "html": html_content
        }
        
        # Send with inline image if available
        if image_data:
            files = [("inline", ("email_pic1", image_data, "image/png"))]
            return requests.post(
                "https://api.mailgun.net/v3/sandboxad2ef991cd4643e990f0338482f1cb90.mailgun.org/messages",
                auth=("api", os.getenv('API_KEY', 'API_KEY')),
                data=data,
                files=files
            )
        else:
            return requests.post(
                "https://api.mailgun.net/v3/sandboxad2ef991cd4643e990f0338482f1cb90.mailgun.org/messages",
                auth=("api", os.getenv('API_KEY', 'API_KEY')),
                data=data
            )

if __name__ == "__main__":
    response = send_simple_message()
    if response.status_code == 200:
        print("Email sent successfully!")
        print(f"Response: {response.json()}")
    else:
        print(f"Failed to send email. Status code: {response.status_code}")
        print(f"Response: {response.text}")