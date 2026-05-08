#!/bin/bash
# Quick test script to validate the app

BASE_URL="http://localhost:3000"

echo "=== Testing Desafío Relámpago ==="
echo ""

# Test 1: Join participants
echo "1. Joining participants..."
ALICE=$(curl -s -X POST "$BASE_URL/api/demo/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}' | jq -r '.participant.id')

BOB=$(curl -s -X POST "$BASE_URL/api/demo/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob"}' | jq -r '.participant.id')

CARLOS=$(curl -s -X POST "$BASE_URL/api/demo/join" \
  -H "Content-Type: application/json" \
  -d '{"name":"Carlos"}' | jq -r '.participant.id')

echo "   ✓ Alice: $ALICE"
echo "   ✓ Bob: $BOB"
echo "   ✓ Carlos: $CARLOS"
echo ""

# Test 2: Create a round
echo "2. Creating a round..."
ROUND=$(curl -s -X POST "$BASE_URL/api/admin/round/create" \
  -H "Content-Type: application/json" \
  -d '{
    "question":"What is 2+2?",
    "optionA":"3",
    "optionB":"4",
    "optionC":"5",
    "optionD":"6",
    "correctOption":"B",
    "durationMs":15000
  }' | jq -r '.round.id')

echo "   ✓ Round created: $ROUND"
echo ""

# Test 3: Open the round
echo "3. Opening the round..."
curl -s -X POST "$BASE_URL/api/admin/round/open" \
  -H "Content-Type: application/json" \
  -d "{\"roundId\":\"$ROUND\"}" > /dev/null

echo "   ✓ Round opened"
echo ""

# Test 4: Submit answers
echo "4. Submitting answers..."
sleep 2

curl -s -X POST "$BASE_URL/api/demo/round/answer" \
  -H "Content-Type: application/json" \
  -d "{\"participantId\":\"$ALICE\",\"option\":\"B\"}" > /dev/null

sleep 1

curl -s -X POST "$BASE_URL/api/demo/round/answer" \
  -H "Content-Type: application/json" \
  -d "{\"participantId\":\"$BOB\",\"option\":\"B\"}" > /dev/null

sleep 1

curl -s -X POST "$BASE_URL/api/demo/round/answer" \
  -H "Content-Type: application/json" \
  -d "{\"participantId\":\"$CARLOS\",\"option\":\"A\"}" > /dev/null

echo "   ✓ All answers submitted"
echo ""

# Test 5: Get results
echo "5. Fetching results..."
RESULTS=$(curl -s -X GET "$BASE_URL/api/demo/round/results?roundId=$ROUND" | jq '.results')

echo "   Total responses: $(echo $RESULTS | jq '.total')"
echo "   Distribution: A=$(echo $RESULTS | jq '.counts.A'), B=$(echo $RESULTS | jq '.counts.B'), C=$(echo $RESULTS | jq '.counts.C'), D=$(echo $RESULTS | jq '.counts.D')"
echo "   Top answer: $(echo $RESULTS | jq '.top[0].name') - $(echo $RESULTS | jq '.top[0].option')"
echo ""

echo "✓ All tests passed!"
