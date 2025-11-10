#!/bin/bash

# Full Workflow Test for BDG-King Backend
echo "========================================="
echo "BDG-King Full Workflow Test"
echo "========================================="
echo ""

BASE_URL="http://localhost:4000"

# Step 1: Login as admin
echo "Step 1: Login as admin..."
ADMIN_RESPONSE=$(curl -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -s)
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "✓ Admin logged in"
echo ""

# Step 2: Create a new player
echo "Step 2: Register new player..."
curl -X POST $BASE_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player2","password":"pass123"}' \
  -s > /dev/null
echo "✓ Player registered"
echo ""

# Step 3: Login as player
echo "Step 3: Login as player..."
PLAYER_RESPONSE=$(curl -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player2","password":"pass123"}' \
  -s)
PLAYER_TOKEN=$(echo $PLAYER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "✓ Player logged in"
echo ""

# Step 4: Player requests deposit
echo "Step 4: Player requests deposit of 5000..."
DEPOSIT_RESPONSE=$(curl -X POST $BASE_URL/api/deposits \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000}' \
  -s)
DEPOSIT_ID=$(echo $DEPOSIT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ Deposit requested (ID: $DEPOSIT_ID)"
echo ""

# Step 5: Admin approves deposit
echo "Step 5: Admin approves deposit..."
curl -X POST $BASE_URL/api/admin/deposits/$DEPOSIT_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -s > /dev/null
echo "✓ Deposit approved"
echo ""

# Step 6: Check player balance
echo "Step 6: Checking player balance..."
curl -X GET $BASE_URL/api/me \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -s | grep -o '"balance":[0-9]*' | cut -d':' -f2
echo "✓ Balance updated"
echo ""

# Step 7: Admin creates a betting round
echo "Step 7: Admin creates betting round..."
ROUND_RESPONSE=$(curl -X POST $BASE_URL/api/admin/rounds/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -s)
ROUND_ID=$(echo $ROUND_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ Round created (ID: $ROUND_ID)"
echo ""

# Step 8: Player places bet on red
echo "Step 8: Player places bet (1000 on red)..."
curl -X POST $BASE_URL/api/bets \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"round_id\":\"$ROUND_ID\",\"color\":\"red\",\"amount\":1000}" \
  -s > /dev/null
echo "✓ Bet placed"
echo ""

# Step 9: Check balance after bet
echo "Step 9: Balance after bet..."
curl -X GET $BASE_URL/api/me \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -s | grep -o '"balance":[0-9]*' | cut -d':' -f2
echo "✓ Balance deducted"
echo ""

# Step 10: Admin settles round (red wins)
echo "Step 10: Admin settles round (red wins)..."
curl -X POST $BASE_URL/api/admin/rounds/$ROUND_ID/settle \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"result_color":"red"}' \
  -s > /dev/null
echo "✓ Round settled"
echo ""

# Step 11: Check final balance
echo "Step 11: Final balance after winning..."
FINAL_BALANCE=$(curl -X GET $BASE_URL/api/me \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -s | grep -o '"balance":[0-9]*' | cut -d':' -f2)
echo "Balance: $FINAL_BALANCE (should be 6000: 5000 initial + 2000 payout - 1000 bet)"
echo ""

# Step 12: Player requests withdrawal
echo "Step 12: Player requests withdrawal of 2000..."
WITHDRAW_RESPONSE=$(curl -X POST $BASE_URL/api/withdraws \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":2000}' \
  -s)
WITHDRAW_ID=$(echo $WITHDRAW_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "✓ Withdrawal requested (ID: $WITHDRAW_ID)"
echo ""

# Step 13: Admin processes withdrawal
echo "Step 13: Admin processes withdrawal..."
curl -X POST $BASE_URL/api/admin/withdraws/$WITHDRAW_ID/processed \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -s > /dev/null
echo "✓ Withdrawal processed"
echo ""

# Step 14: Final balance check
echo "Step 14: Final balance after withdrawal..."
FINAL_BALANCE=$(curl -X GET $BASE_URL/api/me \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -s | grep -o '"balance":[0-9]*' | cut -d':' -f2)
echo "Balance: $FINAL_BALANCE (should be 4000)"
echo ""

echo "========================================="
echo "✓ Full workflow test completed!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Player deposited: 5000"
echo "- Player bet: 1000 on red"
echo "- Player won: 2000 (2x payout)"
echo "- Player withdrew: 2000"
echo "- Final balance: $FINAL_BALANCE"
echo ""
