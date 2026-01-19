#!/bin/bash

# Live Demo Script with Auto-Reset
# This script runs a complete demo cycle:
# 1. Reset databases to clean state
# 2. Seed with demo data
# 3. Run Sarah's demo
# 4. Run James's demo
# 5. Reset databases back to clean state

set -e  # Exit on error

echo ""
echo "======================================================================"
echo "🎬 LIVE DEMO WITH AUTO-RESET"
echo "======================================================================"
echo ""
echo "This will:"
echo "  1. Clear all demo data"
echo "  2. Seed fresh data for Sarah and James"
echo "  3. Run both demos with REAL AWS calls"
echo "  4. Reset to clean state"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Step 1: Reset
echo ""
echo "======================================================================"
echo "Step 1/5: Resetting databases..."
echo "======================================================================"
npm run reset

# Step 2: Seed
echo ""
echo "======================================================================"
echo "Step 2/5: Seeding demo data..."
echo "======================================================================"
npm run seed

# Step 3: Sarah's Demo
echo ""
echo "======================================================================"
echo "Step 3/5: Running Sarah's Demo (Engaged Supporter)..."
echo "======================================================================"
npm run demo:sarah

# Wait between demos
echo ""
echo "Press Enter to continue to James's demo..."
read

# Step 4: James's Demo
echo ""
echo "======================================================================"
echo "Step 4/5: Running James's Demo (Lapsed Supporter)..."
echo "======================================================================"
npm run demo:james

# Step 5: Reset
echo ""
echo "======================================================================"
echo "Step 5/5: Resetting to clean state..."
echo "======================================================================"
npm run reset

echo ""
echo "======================================================================"
echo "✅ LIVE DEMO COMPLETE"
echo "======================================================================"
echo ""
echo "All databases have been reset to clean state."
echo "Run 'npm run demo:prepare' to set up for another demo."
echo ""
