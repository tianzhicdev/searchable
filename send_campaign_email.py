#!/usr/bin/env python3
"""
Send marketing campaign emails to a list of recipients from CSV file
Usage: python3 send_campaign_email.py [brand] <csv_file>
"""

import os
import sys
import csv
import requests
import time
import json
from datetime import datetime

def send_email(api_key, domain, from_email, to_email, to_name, brand):
    """Send a single marketing email"""
    
    # Set all brand-specific content and configuration
    if brand == "abitchaotic":
        subject = "Join abitchaotic.com - Sell Digital, Get Crypto with the Lowest Fees on the Planet"
        text_content = "The talented shall be rewarded.\nMonetize your digital content for USDT while enjoying the lowest fees on the planet at 1% with no KYC. We handle the conversion of buyers' USD to USDT and deliver instant withdrawals straight to your Ethereum wallet."
        contact_email = "info@abitchaotic.com"
        site_url = "https://abitchaotic.com"
        site_name = "abitchaotic.com"
        brand_name = "abitchaotic"
        mailgun_url = "https://api.mailgun.net/v3/abitchaotic.com/messages"
    else:
        subject = "Join Eccentric Protocol: Sell Art for Cyrpto, with the Lowest Fees on the Planet"
        text_content = "The talented shall be rewarded.\nMonetize your digital content for USDT while enjoying the lowest fees on the planet at 1% with no KYC. We handle the conversion of buyers' USD to USDT and deliver instant withdrawals straight to your Ethereum wallet."
        contact_email = "info@eccentricprotocol.com"
        site_url = "https://eccentricprotocol.com"
        site_name = "eccentricprotocol.com"
        brand_name = "Eccentric Protocol"
        mailgun_url = "https://api.mailgun.net/v3/eccentricprotocol.com/messages"
    
    # HTML content template (same structure for both brands)
    html_content = f"""
    <html>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="margin-bottom: 20px; color: #333;">
                <h2 style="color: #333; margin-bottom: 10px;">{subject}</h2>
                <p style="line-height: 1.6; margin-bottom: 15px;">
                    {text_content}
                </p>
                <p style="line-height: 1.6; margin-bottom: 20px;">
                    Click below to join {site_name} right now!
                </p>
            </div>
            <a href="{site_url}" target="_blank" style="display: block;">
                <img src="cid:{site_name}.png" alt="Join {site_name}" style="width: 100%; max-width: 600px; height: auto; display: block;">
            </a>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                <p>Have a question? Contact <a href="mailto:{contact_email}" style="color: #4a90e2;">{contact_email}</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Prepare the image file
    image_path = "marketing/email_pic1.png"
    
    if not os.path.exists(image_path):
        print(f"Warning: Image file {image_path} not found")
        # Continue without image
        files = None
    else:
        with open(image_path, "rb") as f:
            image_data = f.read()
        files = [("inline", (site_name + ".png", image_data, "image/png"))]
    
    # Send via Mailgun
    try:
        response = requests.post(
            mailgun_url,
            auth=("api", api_key),
            files=files if files else None,
            data={
                "from": from_email,
                "to": f"{to_name} <{to_email}>",
                "subject": subject,
                "text": text_content,
                "html": html_content,
                "o:tracking": "no",
                "o:tracking-clicks": "no",
                "o:tracking-opens": "no"
            },
            timeout=30  # Add timeout
        )
        
        if response.status_code == 200:
            return True, response.json().get('id', 'Success')
        else:
            return False, f"Error {response.status_code}: {response.text}"
            
    except requests.exceptions.SSLError as e:
        return False, f"SSL Error: {str(e)}"
    except requests.exceptions.ConnectionError as e:
        return False, f"Connection Error: {str(e)}"
    except requests.exceptions.Timeout as e:
        return False, f"Timeout Error: {str(e)}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def create_log_filename(csv_file, brand):
    """Create a unique log filename based on CSV file and timestamp"""
    base_name = os.path.splitext(os.path.basename(csv_file))[0]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_dir = "marketing/campaign_logs"
    
    # Create log directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    return os.path.join(log_dir, f"campaign_{brand}_{base_name}_{timestamp}.json")

def process_csv(csv_file, api_key, domain, from_email, brand):
    """Process CSV file and send emails to all recipients"""
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file '{csv_file}' not found")
        return False
    
    success_count = 0
    error_count = 0
    processed_emails = set()
    total_rows = 0
    
    # Initialize campaign log
    log_filename = create_log_filename(csv_file, brand)
    campaign_log = {
        "campaign_info": {
            "timestamp": datetime.now().isoformat(),
            "csv_file": csv_file,
            "brand": brand,
            "from_email": from_email,
            "domain": domain
        },
        "results": [],
        "summary": {}
    }
    
    print(f"\n📧 Starting email campaign from {csv_file}")
    print(f"Brand: {brand}")
    print(f"From: {from_email}")
    print(f"Log file: {log_filename}")
    print("-" * 60)
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            # Convert to list to get total count
            reader = list(csv.DictReader(file))
            total_rows = len(reader)
            
            for row_num, row in enumerate(reader, start=1):
                # Get email and title
                email = row.get('email', '').strip()
                title = row.get('title', '').strip()
                
                if not email:
                    print(f"Row {row_num + 1}: Skipping - no email address")
                    continue
                
                # Skip duplicates
                if email.lower() in processed_emails:
                    print(f"Row {row_num + 1}: Skipping {email} - duplicate")
                    continue
                
                processed_emails.add(email.lower())
                
                # Use title as name, or extract from email if no title
                if title:
                    to_name = title
                else:
                    to_name = email.split('@')[0].replace('.', ' ').title()
                
                print(f"Row {row_num + 1}: Sending to {email} ({to_name})... ", end='', flush=True)
                
                # Record start time
                start_time = datetime.now()
                
                # Send email
                success, message = send_email(api_key, domain, from_email, email, to_name, brand)
                
                # Record end time
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                # Log the result
                email_result = {
                    "row": row_num + 1,
                    "email": email,
                    "name": to_name,
                    "title": title,
                    "timestamp": end_time.isoformat(),
                    "duration_seconds": duration,
                    "success": success,
                    "message": message
                }
                campaign_log["results"].append(email_result)
                
                if success:
                    print("✅ Sent")
                    success_count += 1
                else:
                    print(f"❌ Failed: {message}")
                    error_count += 1
                
                # Save log after each email (in case of script interruption)
                with open(log_filename, 'w') as log_file:
                    json.dump(campaign_log, log_file, indent=2)
                
                # Rate limiting - wait between emails to avoid hitting limits
                if row_num < total_rows:  # Not the last email
                    time.sleep(0.5)  # 500ms delay between emails
    
    except Exception as e:
        print(f"\nError reading CSV file: {e}")
        # Save error to log
        campaign_log["error"] = str(e)
        with open(log_filename, 'w') as log_file:
            json.dump(campaign_log, log_file, indent=2)
        return False
    
    # Calculate final statistics
    total_processed = success_count + error_count
    duplicates_skipped = len(processed_emails) - total_processed
    campaign_end_time = datetime.now()
    
    # Update campaign summary
    campaign_log["summary"] = {
        "end_timestamp": campaign_end_time.isoformat(),
        "duration_seconds": (campaign_end_time - datetime.fromisoformat(campaign_log["campaign_info"]["timestamp"])).total_seconds(),
        "total_rows_in_csv": total_rows,
        "total_processed": total_processed,
        "successful": success_count,
        "failed": error_count,
        "duplicates_skipped": duplicates_skipped,
        "success_rate": f"{(success_count / total_processed * 100):.1f}%" if total_processed > 0 else "0%"
    }
    
    # Save final log
    with open(log_filename, 'w') as log_file:
        json.dump(campaign_log, log_file, indent=2)
    
    print("-" * 60)
    print(f"\n📊 Campaign Summary:")
    print(f"✅ Successfully sent: {success_count}")
    print(f"❌ Failed: {error_count}")
    print(f"📧 Total processed: {total_processed}")
    print(f"🔁 Duplicates skipped: {duplicates_skipped}")
    print(f"📈 Success rate: {campaign_log['summary']['success_rate']}")
    print(f"\n📝 Full campaign log saved to: {log_filename}")
    
    # Return True if at least some emails were sent successfully
    return success_count > 0

def main():
    # Parse arguments
    if len(sys.argv) < 2:
        print("Usage: python3 send_campaign_email.py [brand] <csv_file>")
        print("  brand: 'abitchaotic' or omit for eccentricprotocol")
        print("  csv_file: Path to CSV file with 'title' and 'email' columns")
        sys.exit(1)
    
    # Determine brand and CSV file
    if len(sys.argv) == 3 and sys.argv[1] == "abitchaotic":
        brand = "abitchaotic"
        csv_file = sys.argv[2]
    else:
        brand = "eccentricprotocol"
        csv_file = sys.argv[1]
    
    # Get API key from environment
    api_key = os.getenv('API_KEY')
    if not api_key:
        print("Error: API_KEY environment variable not set")
        sys.exit(1)
    
    # Set domain and from email based on brand
    if brand == "abitchaotic":
        domain = "mg.abitchaotic.com"
        from_email = "abitchaotic <info@abitchaotic.com>"
    else:
        domain = "mg.eccentricprotocol.com"
        from_email = "Eccentric Protocol <info@eccentricprotocol.com>"
    
    print(f"🚀 Email Campaign Sender")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Process the CSV and send emails
    success = process_csv(csv_file, api_key, domain, from_email, brand)
    
    if success:
        print(f"\n✅ Campaign completed!")
        sys.exit(0)
    else:
        print(f"\n❌ Campaign failed - no emails were sent successfully")
        sys.exit(1)

if __name__ == "__main__":
    main()