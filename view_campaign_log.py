#!/usr/bin/env python3
"""
View email campaign logs
Usage: python3 view_campaign_log.py [log_file]
       python3 view_campaign_log.py --list
       python3 view_campaign_log.py --latest
"""

import os
import sys
import json
from datetime import datetime
from tabulate import tabulate

def list_logs():
    """List all campaign log files"""
    log_dir = "marketing/campaign_logs"
    
    if not os.path.exists(log_dir):
        print("No campaign logs found.")
        return
    
    logs = []
    for filename in os.listdir(log_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(log_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                    logs.append({
                        'filename': filename,
                        'timestamp': data['campaign_info']['timestamp'],
                        'brand': data['campaign_info']['brand'],
                        'csv': os.path.basename(data['campaign_info']['csv_file']),
                        'total': data.get('summary', {}).get('total_processed', 'N/A'),
                        'success': data.get('summary', {}).get('successful', 'N/A')
                    })
            except:
                continue
    
    # Sort by timestamp descending
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Display table
    headers = ['Filename', 'Date/Time', 'Brand', 'CSV', 'Total', 'Success']
    table_data = []
    for log in logs:
        dt = datetime.fromisoformat(log['timestamp'])
        table_data.append([
            log['filename'],
            dt.strftime('%Y-%m-%d %H:%M:%S'),
            log['brand'],
            log['csv'],
            log['total'],
            log['success']
        ])
    
    print("\n📋 Campaign Logs:")
    print(tabulate(table_data, headers=headers, tablefmt='grid'))

def get_latest_log():
    """Get the most recent log file"""
    log_dir = "marketing/campaign_logs"
    
    if not os.path.exists(log_dir):
        return None
    
    logs = []
    for filename in os.listdir(log_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(log_dir, filename)
            stat = os.stat(filepath)
            logs.append((stat.st_mtime, filepath))
    
    if not logs:
        return None
    
    logs.sort(reverse=True)
    return logs[0][1]

def view_log(log_file):
    """View a specific campaign log"""
    if not os.path.exists(log_file):
        print(f"Error: Log file '{log_file}' not found")
        return
    
    with open(log_file, 'r') as f:
        data = json.load(f)
    
    # Display campaign info
    print("\n📧 Campaign Information:")
    print("-" * 60)
    info = data['campaign_info']
    print(f"Timestamp: {info['timestamp']}")
    print(f"CSV File: {info['csv_file']}")
    print(f"Brand: {info['brand']}")
    print(f"From: {info['from_email']}")
    print(f"Domain: {info['domain']}")
    
    # Display summary if available
    if 'summary' in data:
        print("\n📊 Summary:")
        print("-" * 60)
        summary = data['summary']
        print(f"Duration: {summary['duration_seconds']:.1f} seconds")
        print(f"Total rows in CSV: {summary['total_rows_in_csv']}")
        print(f"Processed: {summary['total_processed']}")
        print(f"Successful: {summary['successful']} ✅")
        print(f"Failed: {summary['failed']} ❌")
        print(f"Duplicates skipped: {summary['duplicates_skipped']}")
        print(f"Success rate: {summary['success_rate']}")
    
    # Display failed emails
    failed = [r for r in data['results'] if not r['success']]
    if failed:
        print(f"\n❌ Failed Emails ({len(failed)}):")
        print("-" * 60)
        for result in failed:
            print(f"Row {result['row']}: {result['email']} - {result['message']}")
    
    # Display successful emails summary
    successful = [r for r in data['results'] if r['success']]
    if successful:
        print(f"\n✅ Successful Emails ({len(successful)}):")
        print("-" * 60)
        # Just show first and last few
        if len(successful) > 10:
            for result in successful[:3]:
                print(f"Row {result['row']}: {result['email']}")
            print(f"... and {len(successful) - 6} more ...")
            for result in successful[-3:]:
                print(f"Row {result['row']}: {result['email']}")
        else:
            for result in successful:
                print(f"Row {result['row']}: {result['email']}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 view_campaign_log.py [log_file]")
        print("       python3 view_campaign_log.py --list")
        print("       python3 view_campaign_log.py --latest")
        sys.exit(1)
    
    if sys.argv[1] == '--list':
        list_logs()
    elif sys.argv[1] == '--latest':
        log_file = get_latest_log()
        if log_file:
            print(f"Viewing latest log: {log_file}")
            view_log(log_file)
        else:
            print("No campaign logs found.")
    else:
        view_log(sys.argv[1])

if __name__ == "__main__":
    main()