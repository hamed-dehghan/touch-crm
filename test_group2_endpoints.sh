#!/bin/bash
# test_group2_endpoints.sh
# Comprehensive testing script for Group 2 API endpoints (lines 81-133)

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
USER_ID=""
PROJECT_ID=""
TASK_ID=""
PRODUCT_ID=""
PROMOTION_ID=""
CUSTOMER_ID=""
WORKLOG_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

# Function to print test results
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

# Setup: Login with admin user to get token
print_section "SETUP: Authentication"

echo "Logging in with admin user..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token. Exiting.${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."

# Get user ID
USER_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")
USER_ID=$(echo $USER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "User ID: $USER_ID"

# Create a customer for testing (needed for projects, worklogs, etc)
echo "Creating test customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Customer",
    "email": "customer'$(date +%s)'@test.com",
    "phoneNumber": "1'$(date +%s)'",
    "customerType": "PERSON",
    "status": "CUSTOMER",
    "customerLevelId": 1
  }')
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Customer ID: $CUSTOMER_ID"

# ================================================
# 7. USER MANAGEMENT (4 endpoints) - Tests #31-34
# ================================================
print_section "7. USER MANAGEMENT (4 endpoints)"

# Test #31: GET /users
echo "Test #31: GET /users"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 31 "GET /users" 0 || print_test 31 "GET /users" 1

# Test #32: POST /users
echo -e "\nTest #32: POST /users"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'$(date +%s)$RANDOM'",
    "fullName": "New Test User",
    "email": "newuser'$(date +%s)$RANDOM'@test.com",
    "password": "Pass123!@#",
    "roleId": 2
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
NEW_USER_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 32 "POST /users" 0 || print_test 32 "POST /users" 1

# Test #33: PUT /users/:id
if [ ! -z "$NEW_USER_ID" ]; then
    echo -e "\nTest #33: PUT /users/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/users/$NEW_USER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "fullName": "Updated Test User"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 33 "PUT /users/:id" 0 || print_test 33 "PUT /users/:id" 1
fi

# Test #34: DELETE /users/:id
if [ ! -z "$NEW_USER_ID" ]; then
    echo -e "\nTest #34: DELETE /users/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/users/$NEW_USER_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 34 "DELETE /users/:id" 0 || print_test 34 "DELETE /users/:id" 1
fi

# ================================================
# 8. PROJECT MANAGEMENT (4 endpoints) - Tests #35-38
# ================================================
print_section "8. PROJECT MANAGEMENT (4 endpoints)"

# Test #35: POST /projects
echo "Test #35: POST /projects"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Project",
    "description": "A test project for API testing",
    "customerId": '$CUSTOMER_ID'
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
PROJECT_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 35 "POST /projects" 0 || print_test 35 "POST /projects" 1

# Test #36: GET /projects
echo -e "\nTest #36: GET /projects"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 36 "GET /projects" 0 || print_test 36 "GET /projects" 1

# Test #37: GET /projects/:id
if [ ! -z "$PROJECT_ID" ]; then
    echo -e "\nTest #37: GET /projects/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 37 "GET /projects/:id" 0 || print_test 37 "GET /projects/:id" 1
fi

# Test #38: PUT /projects/:id
if [ ! -z "$PROJECT_ID" ]; then
    echo -e "\nTest #38: PUT /projects/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "IN_PROGRESS",
        "description": "Updated project description"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 38 "PUT /projects/:id" 0 || print_test 38 "PUT /projects/:id" 1
fi

# ================================================
# 9. TASK MANAGEMENT (6 endpoints) - Tests #39-44
# ================================================
print_section "9. TASK MANAGEMENT (6 endpoints)"

# Test #39: POST /tasks
echo "Test #39: POST /tasks"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "A test task for API testing",
    "projectId": '$PROJECT_ID',
    "assignedToUserId": '$USER_ID',
    "dueDate": "2026-02-15"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
TASK_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 39 "POST /tasks" 0 || print_test 39 "POST /tasks" 1

# Test #40: GET /tasks/my-tasks
echo -e "\nTest #40: GET /tasks/my-tasks"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/tasks/my-tasks" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 40 "GET /tasks/my-tasks" 0 || print_test 40 "GET /tasks/my-tasks" 1

# Test #41: GET /tasks
echo -e "\nTest #41: GET /tasks"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 41 "GET /tasks" 0 || print_test 41 "GET /tasks" 1

# Test #42: GET /tasks/:id
if [ ! -z "$TASK_ID" ]; then
    echo -e "\nTest #42: GET /tasks/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 42 "GET /tasks/:id" 0 || print_test 42 "GET /tasks/:id" 1
fi

# Test #43: PUT /tasks/:id/status
if [ ! -z "$TASK_ID" ]; then
    echo -e "\nTest #43: PUT /tasks/:id/status"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/tasks/$TASK_ID/status" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "IN_PROGRESS"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 43 "PUT /tasks/:id/status" 0 || print_test 43 "PUT /tasks/:id/status" 1
fi

# Test #44: PUT /tasks/:id
if [ ! -z "$TASK_ID" ]; then
    echo -e "\nTest #44: PUT /tasks/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/tasks/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "priority": "medium",
        "description": "Updated task description"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 44 "PUT /tasks/:id" 0 || print_test 44 "PUT /tasks/:id" 1
fi

# ================================================
# 10. WORKLOG MANAGEMENT (2 endpoints) - Tests #45-46
# ================================================
print_section "10. WORKLOG MANAGEMENT (2 endpoints)"

# Test #45: POST /worklogs
echo "Test #45: POST /worklogs"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/worklogs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": '$CUSTOMER_ID',
    "taskId": '$TASK_ID',
    "description": "Test worklog entry",
    "result": "Work completed successfully",
    "durationMinutes": 120,
    "logDate": "2026-02-04"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
WORKLOG_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 45 "POST /worklogs" 0 || print_test 45 "POST /worklogs" 1

# Test #46: GET /worklogs
echo -e "\nTest #46: GET /worklogs"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/worklogs" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 46 "GET /worklogs" 0 || print_test 46 "GET /worklogs" 1

# ================================================
# 11. PRODUCT MANAGEMENT (5 endpoints) - Tests #47-51
# ================================================
print_section "11. PRODUCT MANAGEMENT (5 endpoints)"

# Test #47: POST /products
echo "Test #47: POST /products"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "price": 99.99,
    "taxRate": 10
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
PRODUCT_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 47 "POST /products" 0 || print_test 47 "POST /products" 1

# Test #48: GET /products
echo -e "\nTest #48: GET /products"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 48 "GET /products" 0 || print_test 48 "GET /products" 1

# Test #49: GET /products/:id
if [ ! -z "$PRODUCT_ID" ]; then
    echo -e "\nTest #49: GET /products/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/products/$PRODUCT_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 49 "GET /products/:id" 0 || print_test 49 "GET /products/:id" 1
fi

# Test #50: PUT /products/:id
if [ ! -z "$PRODUCT_ID" ]; then
    echo -e "\nTest #50: PUT /products/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/products/$PRODUCT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "price": 89.99,
        "productName": "Updated Test Product"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 50 "PUT /products/:id" 0 || print_test 50 "PUT /products/:id" 1
fi

# Test #51: DELETE /products/:id (will test later to avoid affecting other tests)
# We'll create another product for deletion
echo -e "\nTest #51: DELETE /products/:id"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Product To Delete",
    "price": 10.00,
    "taxRate": 5
  }')
DELETE_PRODUCT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ ! -z "$DELETE_PRODUCT_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/products/$DELETE_PRODUCT_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 51 "DELETE /products/:id" 0 || print_test 51 "DELETE /products/:id" 1
fi

# ================================================
# 12. PROMOTION MANAGEMENT (6 endpoints) - Tests #52-57
# ================================================
print_section "12. PROMOTION MANAGEMENT (6 endpoints)"

# Test #52: POST /promotions
echo "Test #52: POST /promotions"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/promotions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Promotion",
    "rewardType": "PERCENTAGE",
    "rewardValue": 15,
    "conditionJson": "{\"minPurchase\": 100}",
    "durationDays": 30
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
PROMOTION_ID=$(echo $BODY | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 201 ] && print_test 52 "POST /promotions" 0 || print_test 52 "POST /promotions" 1

# Test #53: GET /promotions
echo -e "\nTest #53: GET /promotions"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/promotions" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
echo "Response: $BODY"
[ "$HTTP_CODE" -eq 200 ] && print_test 53 "GET /promotions" 0 || print_test 53 "GET /promotions" 1

# Test #54: GET /promotions/:id
if [ ! -z "$PROMOTION_ID" ]; then
    echo -e "\nTest #54: GET /promotions/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/promotions/$PROMOTION_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 54 "GET /promotions/:id" 0 || print_test 54 "GET /promotions/:id" 1
fi

# Test #55: PUT /promotions/:id
if [ ! -z "$PROMOTION_ID" ]; then
    echo -e "\nTest #55: PUT /promotions/:id"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/promotions/$PROMOTION_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "rewardValue": 20,
        "title": "Updated Test Promotion"
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 55 "PUT /promotions/:id" 0 || print_test 55 "PUT /promotions/:id" 1
fi

# Test #57: POST /promotions/:id/assign
if [ ! -z "$PROMOTION_ID" ]; then
    echo -e "\nTest #57: POST /promotions/:id/assign"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/promotions/$PROMOTION_ID/assign" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "customerId": '$CUSTOMER_ID'
      }')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 201 ] && print_test 57 "POST /promotions/:id/assign" 0 || print_test 57 "POST /promotions/:id/assign" 1
fi

# Test #56: DELETE /promotions/:id
# Create another promotion for deletion
echo -e "\nTest #56: DELETE /promotions/:id"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/promotions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Promotion To Delete",
    "rewardType": "FIXED_AMOUNT",
    "rewardValue": 10,
    "conditionJson": "{\"minPurchase\": 50}",
    "durationDays": 30
  }')
DELETE_PROMOTION_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ ! -z "$DELETE_PROMOTION_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/promotions/$DELETE_PROMOTION_ID" \
      -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    echo "Response: $BODY"
    [ "$HTTP_CODE" -eq 200 ] && print_test 56 "DELETE /promotions/:id" 0 || print_test 56 "DELETE /promotions/:id" 1
fi

# ================================================
# SUMMARY
# ================================================
print_section "TEST SUMMARY"
echo "All 27 endpoints from Group 2 (lines 81-133) have been tested."
echo "Review the output above for any failures."
echo ""
echo "Created test resources:"
echo "  - Customer ID: $CUSTOMER_ID"
echo "  - Project ID: $PROJECT_ID"
echo "  - Task ID: $TASK_ID"
echo "  - Product ID: $PRODUCT_ID"
echo "  - Promotion ID: $PROMOTION_ID"
echo "  - Worklog ID: $WORKLOG_ID"
