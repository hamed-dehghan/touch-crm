#!/bin/bash
# test_group1_endpoints.sh
# Comprehensive testing script for Group 1 API endpoints (Higher Complexity - lines 20-78)

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
USER_ID=""
CUSTOMER_ID=""
ORDER_ID=""
TRANSACTION_ID=""
CAMPAIGN_ID=""
ROLE_ID=""
PERMISSION_ID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_section() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_test() {
    local test_num=$1
    local endpoint=$2
    local status=$3
    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✓ Test #$test_num: $endpoint - PASSED${NC}"
    else
        echo -e "${RED}✗ Test #$test_num: $endpoint - FAILED${NC}"
    fi
}

# ================================================
# SETUP: Authentication
# ================================================
print_section "SETUP: Authentication"

# ================================================
# 1. AUTHENTICATION & AUTHORIZATION (3 endpoints) - Tests #1-3
# ================================================
print_section "1. AUTHENTICATION & AUTHORIZATION (3 endpoints)"

# Test #2: POST /auth/login (test first to get token)
echo "Test #2: POST /auth/login"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
TOKEN=$(echo $BODY | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 2 "POST /auth/login" 0 || print_test 2 "POST /auth/login" 1

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Got token: ${TOKEN:0:20}...${NC}"
echo "User ID: $USER_ID"

# Test #1: POST /auth/register
echo -e "\nTest #1: POST /auth/register"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser'$(date +%s)'",
    "password": "NewPass123!",
    "fullName": "New Test User",
    "email": "newuser'$(date +%s)'@test.com",
    "roleId": 2
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 1 "POST /auth/register" 0 || print_test 1 "POST /auth/register" 1

# Test #3: GET /auth/me
echo -e "\nTest #3: GET /auth/me"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 3 "GET /auth/me" 0 || print_test 3 "GET /auth/me" 1

# ================================================
# 2. CUSTOMER MANAGEMENT (7 endpoints) - Tests #4-10
# ================================================
print_section "2. CUSTOMER MANAGEMENT (7 endpoints)"

# Test #4: POST /customers
echo "Test #4: POST /customers"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "2'$(date +%s)'",
    "email": "john.doe'$(date +%s)'@test.com",
    "customerType": "PERSON",
    "status": "CUSTOMER",
    "customerLevelId": 1,
    "address": "123 Test St"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
CUSTOMER_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 4 "POST /customers" 0 || print_test 4 "POST /customers" 1
echo "Customer ID: $CUSTOMER_ID"

# Test #5: GET /customers
echo -e "\nTest #5: GET /customers"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customers?status=CUSTOMER&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 5 "GET /customers" 0 || print_test 5 "GET /customers" 1

# Test #6: GET /customers/:id
if [ ! -z "$CUSTOMER_ID" ]; then
    echo -e "\nTest #6: GET /customers/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customers/$CUSTOMER_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 6 "GET /customers/:id" 0 || print_test 6 "GET /customers/:id" 1
fi

# Test #7: PUT /customers/:id
if [ ! -z "$CUSTOMER_ID" ]; then
    echo -e "\nTest #7: PUT /customers/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/customers/$CUSTOMER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "firstName": "Jane",
        "status": "OPPORTUNITY"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 7 "PUT /customers/:id" 0 || print_test 7 "PUT /customers/:id" 1
fi

# Test #9: GET /customers/:id/worklogs
if [ ! -z "$CUSTOMER_ID" ]; then
    echo -e "\nTest #9: GET /customers/:id/worklogs"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customers/$CUSTOMER_ID/worklogs" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 9 "GET /customers/:id/worklogs" 0 || print_test 9 "GET /customers/:id/worklogs" 1
fi

# Test #10: GET /customers/:id/transactions
if [ ! -z "$CUSTOMER_ID" ]; then
    echo -e "\nTest #10: GET /customers/:id/transactions"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customers/$CUSTOMER_ID/transactions" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 10 "GET /customers/:id/transactions" 0 || print_test 10 "GET /customers/:id/transactions" 1
fi

# Test #8: DELETE /customers/:id (test last to avoid breaking other tests)
# Will create another customer for deletion
echo -e "\nTest #8: DELETE /customers/:id"
DELETE_CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Delete",
    "lastName": "Me",
    "phoneNumber": "3'$(date +%s)'",
    "email": "delete'$(date +%s)'@test.com",
    "customerType": "PERSON",
    "status": "LEAD",
    "customerLevelId": 1
  }')
DELETE_CUSTOMER_ID=$(echo $DELETE_CUSTOMER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ ! -z "$DELETE_CUSTOMER_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/customers/$DELETE_CUSTOMER_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 8 "DELETE /customers/:id" 0 || print_test 8 "DELETE /customers/:id" 1
fi

# ================================================
# 3. ORDER MANAGEMENT (3 endpoints) - Tests #11-13
# ================================================
print_section "3. ORDER MANAGEMENT (3 endpoints)"

# Test #11: POST /orders
if [ ! -z "$CUSTOMER_ID" ]; then
    echo "Test #11: POST /orders"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/orders" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "customerId": '$CUSTOMER_ID',
        "orderItems": [
          {
            "productId": 1,
            "quantity": 2,
            "unitPrice": 100.00
          },
          {
            "productId": 2,
            "quantity": 1,
            "unitPrice": 250.00
          }
        ],
        "discountAmount": 0,
        "taxAmount": 40.50
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    ORDER_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 201 ] && print_test 11 "POST /orders" 0 || print_test 11 "POST /orders" 1
    echo "Order ID: $ORDER_ID"
fi

# Test #12: GET /orders
echo -e "\nTest #12: GET /orders"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 12 "GET /orders" 0 || print_test 12 "GET /orders" 1

# Test #13: GET /orders/:id
if [ ! -z "$ORDER_ID" ]; then
    echo -e "\nTest #13: GET /orders/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 13 "GET /orders/:id" 0 || print_test 13 "GET /orders/:id" 1
fi

# ================================================
# 4. TRANSACTION MANAGEMENT (4 endpoints) - Tests #14-17
# ================================================
print_section "4. TRANSACTION MANAGEMENT (4 endpoints)"

# Test #14: POST /transactions
if [ ! -z "$ORDER_ID" ]; then
    echo "Test #14: POST /transactions"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/transactions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "customerId": '$CUSTOMER_ID',
        "orderId": '$ORDER_ID',
        "amount": 450.00,
        "paymentMethod": "CASH",
        "transactionDate": "2026-02-04"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    TRANSACTION_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 201 ] && print_test 14 "POST /transactions" 0 || print_test 14 "POST /transactions" 1
    echo "Transaction ID: $TRANSACTION_ID"
fi

# Test #15: GET /transactions
echo -e "\nTest #15: GET /transactions"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 15 "GET /transactions" 0 || print_test 15 "GET /transactions" 1

# Test #16: GET /transactions/:id
if [ ! -z "$TRANSACTION_ID" ]; then
    echo -e "\nTest #16: GET /transactions/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/transactions/$TRANSACTION_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 16 "GET /transactions/:id" 0 || print_test 16 "GET /transactions/:id" 1
fi

# Test #17: GET /customers/:id/transactions (already tested as #10 above)
# Skip duplicate test

# ================================================
# 5. CAMPAIGN MANAGEMENT (5 endpoints) - Tests #18-22
# ================================================
print_section "5. CAMPAIGN MANAGEMENT (5 endpoints)"

# Test #18: POST /campaigns
echo "Test #18: POST /campaigns"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "messageTemplate": "Hello {firstName}, special offer for you!",
    "targetAudience": "{\"status\": \"CUSTOMER\"}",
    "scheduledAt": "2026-02-10T10:00:00Z",
    "status": "DRAFT"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
CAMPAIGN_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 18 "POST /campaigns" 0 || print_test 18 "POST /campaigns" 1
echo "Campaign ID: $CAMPAIGN_ID"

# Test #19: GET /campaigns
echo -e "\nTest #19: GET /campaigns"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 19 "GET /campaigns" 0 || print_test 19 "GET /campaigns" 1

# Test #20: GET /campaigns/:id
if [ ! -z "$CAMPAIGN_ID" ]; then
    echo -e "\nTest #20: GET /campaigns/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/campaigns/$CAMPAIGN_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 20 "GET /campaigns/:id" 0 || print_test 20 "GET /campaigns/:id" 1
fi

# Test #21: PUT /campaigns/:id
if [ ! -z "$CAMPAIGN_ID" ]; then
    echo -e "\nTest #21: PUT /campaigns/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/campaigns/$CAMPAIGN_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "SCHEDULED",
        "messageTemplate": "Updated: Hello {firstName}!"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 21 "PUT /campaigns/:id" 0 || print_test 21 "PUT /campaigns/:id" 1
fi

# Test #22: POST /campaigns/:id/execute
if [ ! -z "$CAMPAIGN_ID" ]; then
    echo -e "\nTest #22: POST /campaigns/:id/execute"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/campaigns/$CAMPAIGN_ID/execute" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 22 "POST /campaigns/:id/execute" 0 || print_test 22 "POST /campaigns/:id/execute" 1
fi

# ================================================
# 6. ROLE & PERMISSION MANAGEMENT (8 endpoints) - Tests #23-30
# ================================================
print_section "6. ROLE & PERMISSION MANAGEMENT (8 endpoints)"

# Test #23: GET /roles
echo "Test #23: GET /roles"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/roles" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 23 "GET /roles" 0 || print_test 23 "GET /roles" 1

# Test #24: GET /roles/:id
echo -e "\nTest #24: GET /roles/:id"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/roles/1" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 24 "GET /roles/:id" 0 || print_test 24 "GET /roles/:id" 1

# Test #25: POST /roles
echo -e "\nTest #25: POST /roles"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Test Role '$(date +%s)'",
    "description": "A test role for API testing"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
ROLE_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 25 "POST /roles" 0 || print_test 25 "POST /roles" 1
echo "Role ID: $ROLE_ID"

# Test #26: PUT /roles/:id
if [ ! -z "$ROLE_ID" ]; then
    echo -e "\nTest #26: PUT /roles/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/roles/$ROLE_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "description": "Updated test role description"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 26 "PUT /roles/:id" 0 || print_test 26 "PUT /roles/:id" 1
fi

# Test #28: GET /roles/permissions
echo -e "\nTest #28: GET /roles/permissions"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/roles/permissions" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
PERMISSION_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 28 "GET /roles/permissions" 0 || print_test 28 "GET /roles/permissions" 1
echo "Permission ID: $PERMISSION_ID"

# Test #29: POST /roles/:id/permissions
if [ ! -z "$ROLE_ID" ] && [ ! -z "$PERMISSION_ID" ]; then
    echo -e "\nTest #29: POST /roles/:id/permissions"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/roles/$ROLE_ID/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "permissionIds": ['$PERMISSION_ID']
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 29 "POST /roles/:id/permissions" 0 || print_test 29 "POST /roles/:id/permissions" 1
fi

# Test #30: DELETE /roles/:id/permissions/:permissionId
if [ ! -z "$ROLE_ID" ] && [ ! -z "$PERMISSION_ID" ]; then
    echo -e "\nTest #30: DELETE /roles/:id/permissions/:permissionId"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/roles/$ROLE_ID/permissions/$PERMISSION_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 30 "DELETE /roles/:id/permissions/:permissionId" 0 || print_test 30 "DELETE /roles/:id/permissions/:permissionId" 1
fi

# Test #27: DELETE /roles/:id (test last)
if [ ! -z "$ROLE_ID" ]; then
    echo -e "\nTest #27: DELETE /roles/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/roles/$ROLE_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 27 "DELETE /roles/:id" 0 || print_test 27 "DELETE /roles/:id" 1
fi

# ================================================
# SUMMARY
# ================================================
print_section "TEST SUMMARY"
echo "Group 1 (Higher Complexity) endpoints tested."
echo "Review the output above for any failures."
echo ""
echo "Created test resources:"
echo "  - Customer ID: $CUSTOMER_ID"
echo "  - Order ID: $ORDER_ID"
echo "  - Transaction ID: $TRANSACTION_ID"
echo "  - Campaign ID: $CAMPAIGN_ID"
echo "  - Role ID: $ROLE_ID"
echo "  - Permission ID: $PERMISSION_ID"
