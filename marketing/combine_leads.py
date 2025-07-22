#!/usr/bin/env python3
"""
Combine marketing lead CSV files and deduplicate by email.
Output a clean CSV with only title and email columns.
"""

import csv
import os
import glob
from pathlib import Path
import re

def clean_email(email):
    """Clean and validate email address"""
    if not email:
        return None
    
    # Remove any whitespace
    email = email.strip()
    
    # Basic email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(email_pattern, email):
        return email.lower()  # Normalize to lowercase for deduplication
    
    return None

def clean_title(title):
    """Clean title field"""
    if not title:
        return ""
    
    # Remove extra whitespace and normalize
    title = ' '.join(title.strip().split())
    
    # Remove quotes if they're part of the title
    title = title.strip('"\'')
    
    return title

def read_csv_flexible(filepath):
    """Read CSV file with flexible parsing to handle different formats"""
    leads = []
    
    # Try to detect delimiter and quote character
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        # Read first few lines to detect format
        sample = f.read(1024)
        f.seek(0)
        
        # Detect if file uses quotes
        has_quotes = '"' in sample
        
        # Create appropriate reader
        if has_quotes:
            reader = csv.DictReader(f, quotechar='"', skipinitialspace=True)
        else:
            reader = csv.DictReader(f, skipinitialspace=True)
        
        for row in reader:
            # Try to find email and title in various column names
            email = None
            title = None
            
            # Look for email column (case-insensitive)
            for key in row.keys():
                if key and 'email' in key.lower():
                    email = row[key]
                    break
            
            # Look for title column
            for key in row.keys():
                if key and 'title' in key.lower():
                    title = row[key]
                    break
            
            # If no title column, try name or company
            if not title:
                for key in row.keys():
                    if key and any(word in key.lower() for word in ['name', 'company', 'business']):
                        title = row[key]
                        break
            
            # Clean and validate
            email = clean_email(email)
            title = clean_title(title)
            
            if email:  # Only add if we have a valid email
                leads.append({
                    'title': title or 'No Title',
                    'email': email
                })
    
    return leads

def main():
    # Find all CSV files in the marketing/leads directory
    leads_dir = Path(__file__).parent / 'leads'
    csv_files = list(leads_dir.glob('*.csv'))
    
    if not csv_files:
        print("No CSV files found in marketing/leads directory")
        return
    
    print(f"Found {len(csv_files)} CSV files to process")
    
    # Collect all leads
    all_leads = []
    email_to_lead = {}  # Use dict to handle duplicates
    
    for csv_file in csv_files:
        print(f"Processing: {csv_file.name}")
        try:
            leads = read_csv_flexible(csv_file)
            print(f"  Found {len(leads)} valid leads")
            
            # Add to our collection, keeping the lead with the best title
            for lead in leads:
                email = lead['email']
                if email not in email_to_lead:
                    email_to_lead[email] = lead
                else:
                    # If we already have this email, keep the one with the better title
                    existing_title = email_to_lead[email]['title']
                    new_title = lead['title']
                    
                    # Prefer non-empty titles and longer titles
                    if (existing_title == 'No Title' or 
                        (new_title != 'No Title' and len(new_title) > len(existing_title))):
                        email_to_lead[email] = lead
        
        except Exception as e:
            print(f"  Error processing {csv_file.name}: {e}")
    
    # Convert to list and sort by email
    unique_leads = list(email_to_lead.values())
    unique_leads.sort(key=lambda x: x['email'])
    
    print(f"\nTotal unique leads: {len(unique_leads)}")
    
    # Write output file
    output_file = Path(__file__).parent / 'combined_email_leads.csv'
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['title', 'email'], quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(unique_leads)
    
    print(f"\nOutput written to: {output_file}")
    print(f"Total unique email addresses: {len(unique_leads)}")
    
    # Show some statistics
    no_title_count = sum(1 for lead in unique_leads if lead['title'] == 'No Title')
    if no_title_count > 0:
        print(f"Leads without titles: {no_title_count}")

if __name__ == "__main__":
    main()