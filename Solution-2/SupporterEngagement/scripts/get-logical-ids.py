#!/usr/bin/env python3
"""
Script to extract logical resource IDs from CDK synth output
"""

import subprocess
import re
import sys

def main():
    print("🔍 Extracting Logical Resource IDs from CDK template")
    print("=" * 60)
    print()
    
    # Run CDK synth
    try:
        result = subprocess.run(
            ["npx", "cdk", "synth", "MichaelSupporterEngagement"],
            capture_output=True,
            text=True,
            cwd=".."
        )
        output = result.stdout
    except Exception as e:
        print(f"❌ Failed to run CDK synth: {e}")
        sys.exit(1)
    
    # Extract DynamoDB tables
    print("📊 DynamoDB Tables:")
    print()
    
    table_pattern = r'  (\w+):\s+Type: AWS::DynamoDB::Table.*?TableName: ([^\s]+)'
    tables = re.findall(table_pattern, output, re.DOTALL)
    
    for logical_id, table_name in tables:
        print(f"  Logical ID: {logical_id}")
        print(f"  Table Name: {table_name}")
        print()
    
    # Extract S3 buckets
    print("🪣 S3 Buckets:")
    print()
    
    bucket_pattern = r'  (\w+):\s+Type: AWS::S3::Bucket.*?BucketName: ([^\s]+)'
    buckets = re.findall(bucket_pattern, output, re.DOTALL)
    
    for logical_id, bucket_name in buckets:
        print(f"  Logical ID: {logical_id}")
        print(f"  Bucket Name: {bucket_name}")
        print()
    
    print("=" * 60)
    print()
    print("💡 Use these Logical IDs in the import configuration")
    print()

if __name__ == "__main__":
    main()
