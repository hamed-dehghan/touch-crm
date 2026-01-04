# Environment Configuration Template

Since `.env.example` is in .gitignore, this file serves as a reference for all required environment variables.

Create a `.env` file in the backend root directory with the following variables:

```env
# Environment Configuration

# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=touch_crm
DB_USER=postgres
DB_PASSWORD=postgres
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-use-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# SMS Provider Configuration
SMS_PROVIDER=mock
SMS_API_KEY=
SMS_API_SECRET=
SMS_SENDER_NAME=TouchCRM

# RFM Scoring Thresholds
# Recency (days since last order - lower is better)
RFM_RECENCY_5=7
RFM_RECENCY_4=30
RFM_RECENCY_3=90
RFM_RECENCY_2=180

# Frequency (total order count)
RFM_FREQUENCY_5=20
RFM_FREQUENCY_4=11
RFM_FREQUENCY_3=6
RFM_FREQUENCY_2=3

# Monetary (total spending amount)
RFM_MONETARY_5=10000
RFM_MONETARY_4=5001
RFM_MONETARY_3=1001
RFM_MONETARY_2=501

# Cron Job Schedules (cron syntax)
CRON_RFM_SCHEDULE=0 2 * * *
CRON_BIRTHDAY_SCHEDULE=0 9 * * *
CRON_INACTIVITY_SCHEDULE=0 10 * * 1
CRON_RECURRING_TASKS_SCHEDULE=0 6 * * *

# Message Queue Worker Configuration
MESSAGE_QUEUE_POLL_INTERVAL=10000
MESSAGE_QUEUE_MAX_RETRIES=3
MESSAGE_QUEUE_BATCH_SIZE=10

# Inactivity Threshold (days)
INACTIVITY_THRESHOLD_DAYS=90

# Redis Configuration (optional - for future caching/queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
```

## Variable Descriptions

### Server Configuration
- **NODE_ENV**: Application environment (development, production, test)
- **PORT**: Port number for the Express server
- **API_URL**: Base URL for the API (used in Swagger documentation)

### Database Configuration
- **DB_HOST**: PostgreSQL server hostname
- **DB_PORT**: PostgreSQL server port (default: 5432)
- **DB_NAME**: Database name
- **DB_USER**: Database username
- **DB_PASSWORD**: Database password
- **DB_DIALECT**: Database dialect (postgres)

### JWT Configuration
- **JWT_SECRET**: Secret key for signing JWT tokens (minimum 32 characters recommended)
- **JWT_EXPIRES_IN**: Token expiration time (e.g., 7d, 24h, 1h)

### CORS Configuration
- **CORS_ORIGIN**: Allowed origin for CORS (frontend URL)

### SMS Provider Configuration
- **SMS_PROVIDER**: SMS provider (mock, kavenegar, twilio)
- **SMS_API_KEY**: API key for SMS provider
- **SMS_API_SECRET**: API secret for SMS provider
- **SMS_SENDER_NAME**: Sender name for SMS messages

### RFM Scoring Thresholds
Configure thresholds for RFM (Recency, Frequency, Monetary) scoring:
- **Recency**: Days since last order (lower is better)
- **Frequency**: Total number of orders
- **Monetary**: Total spending amount

### Cron Job Schedules
- **CRON_RFM_SCHEDULE**: RFM scoring job (default: 2 AM daily)
- **CRON_BIRTHDAY_SCHEDULE**: Birthday messages (default: 9 AM daily)
- **CRON_INACTIVITY_SCHEDULE**: Inactivity messages (default: 10 AM Monday)
- **CRON_RECURRING_TASKS_SCHEDULE**: Recurring tasks (default: 6 AM daily)

### Message Queue Configuration
- **MESSAGE_QUEUE_POLL_INTERVAL**: Polling interval in milliseconds (default: 10000)
- **MESSAGE_QUEUE_MAX_RETRIES**: Maximum retry attempts for failed messages (default: 3)
- **MESSAGE_QUEUE_BATCH_SIZE**: Number of messages to process per batch (default: 10)

### Redis Configuration
Optional Redis configuration for future caching and queue management.

## Production Deployment

For production deployment, ensure:
1. Use a strong, randomly generated JWT_SECRET (minimum 32 characters)
2. Set NODE_ENV=production
3. Use secure database credentials
4. Configure proper CORS_ORIGIN
5. Set up real SMS provider credentials
6. Enable HTTPS
7. Configure appropriate cron schedules based on your timezone
