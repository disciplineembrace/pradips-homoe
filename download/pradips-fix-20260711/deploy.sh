#!/bin/bash
# Deploy fixed Pradip's Homoe to Vercel
# USAGE: 
#   export VERCEL_TOKEN='your_vercel_token_here'
#   bash deploy.sh

set -e

if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN env var not set."
  echo "Get your token at: https://vercel.com/account/tokens"
  echo "Then run: export VERCEL_TOKEN='vcp_xxxxxxxx'"
  exit 1
fi

echo "=== Deploying fixed Pradip's Homoe to Vercel ==="
echo ""

# Use the deploy script from the project
python3 /home/z/my-project/scripts/deploy_synth.py
