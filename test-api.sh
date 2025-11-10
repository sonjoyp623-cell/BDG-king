#!/bin/bash

# BDG-King API Test Script
echo "========================================="
echo "BDG-King Backend API Test"
echo "========================================="
echo ""

BASE_URL="http://localhost:4000"

# Test 1: Register a regular user
echo "1. Registering regular user..."
curl -X POST $BASE_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}' \
  -s | jq '.'
echo ""

# Test 2: Register an admin user (manually set in DB later)
echo "2. Registering admin user..."
curl -X POST $BASE_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -s | jq '.'
echo ""

# Test 3: Login as player
echo "3. Logging in as player1..."
PLAYER_TOKEN=$(curl -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}' \
  -s | jq -r '.token')
echo "Token received: ${PLAYER_TOKEN:0:50}..."
echo ""

# Test 4: Get player profile
echo "4. Getting player profile..."
curl -X GET $BASE_URL/api/me \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -s | jq '.'
echo ""

# Test 5: Request a deposit
echo "5. Requesting deposit of 1000..."
curl -X POST $BASE_URL/api/deposits \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000}' \
  -s | jq '.'
echo ""

# Test 6: Get rounds (should be empty)
echo "6. Getting available rounds..."
curl -X GET $BASE_URL/api/rounds -s | jq '.'
echo ""

echo "========================================="
echo "Test completed!"
echo "========================================="
echo ""
echo "Note: To test admin features, you need to:"
echo "1. Manually set is_admin=1 for the admin user in the database"
echo "2. Login as admin and test admin endpoints"
echo ""
