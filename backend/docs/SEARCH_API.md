# List endpoints: basic and advanced search

All search-enabled `GET` list endpoints share the same conventions. Base URL: `/api/v1` (plus your server origin). Authenticate with `Authorization: Bearer <JWT>` unless noted otherwise.

## Basic search

| Parameter | Description |
|-----------|-------------|
| `q` | **Preferred.** Case-insensitive substring match (`ILIKE '%term%'`) across the resource’s documented text fields. |
| `search` | Legacy alias for `q`. If both are sent, `q` wins. |

Rules:

- Leading/trailing whitespace is trimmed.
- Input longer than 200 characters is truncated (server-side guard).
- `%`, `_`, and `\` in the query are escaped so they are treated as literals, not SQL wildcards.

## Advanced search

Additional query parameters filter **exact fields** (IDs, enums, booleans, dates, numeric ranges). They are combined with **AND** logic. When `q` is also present, the text search is **AND**ed with those filters.

## Pagination

Where pagination is supported:

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | `1` | — |
| `limit` | `20` | `100` |

Responses include `pagination: { page, limit, total, totalPages }` for paginated lists.

---

## Resource reference

### Customers — `GET /customers`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `firstName`, `lastName`, `companyName`, `brandName`, `email`, `customerCode` |
| Advanced | `status`, `customerType`, `relationshipType`, `isActive` (`true`/`false`), `createdFrom`, `createdTo` (ISO date, inclusive day range on `createdAt`) |
| Pagination | `page`, `limit` |

### Products — `GET /products`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `productName` |
| Advanced | `minPrice`, `maxPrice` (on `price`) |
| Pagination | `page`, `limit` |

### Orders — `GET /orders`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — numeric `q` matches `id`; text matches linked customer `firstName`, `lastName`, `companyName`, `customerCode` |
| Advanced | `customerId`, `orderDateFrom`, `orderDateTo`, `minFinalAmount`, `maxFinalAmount` |
| Pagination | `page`, `limit` |

### Tasks — `GET /tasks`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `title`, `description` |
| Advanced | `projectId`, `customerId`, `assignedToUserId`, `status`, `dueDateFrom`, `dueDateTo` |
| Pagination | `page`, `limit` |

### My tasks — `GET /tasks/my-tasks`

Same query parameters as `GET /tasks`, but results are restricted to the authenticated user’s assigned tasks.

### Projects — `GET /projects`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `projectName`, `description` |
| Advanced | `customerId`, `status` |
| Pagination | `page`, `limit` |

### Transactions — `GET /transactions`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — numeric `q` matches `id`; text matches customer `firstName`, `lastName`, `customerCode`, and `paymentMethod` |
| Advanced | `customerId`, `orderId`, `paymentMethod` (`CASH` / `CHECK`), `transactionDateFrom`, `transactionDateTo`, `minAmount`, `maxAmount` |
| Pagination | `page`, `limit` |

### Campaigns — `GET /campaigns`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `name`, `messageTemplate` |
| Advanced | `status`, `createdByUserId` |
| Pagination | `page`, `limit` |

### Work logs — `GET /worklogs`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `description`, `result` |
| Advanced | `userId`, `customerId`, `taskId`, `logDateFrom`, `logDateTo` |
| Pagination | `page`, `limit` |

### Promotions — `GET /promotions`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `title` |
| Advanced | `rewardType`, `isActive` (`true`/`false`) |
| Pagination | `page`, `limit` |

### Users — `GET /users`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `username`, `fullName`, `email` |
| Advanced | `roleId`, `isActive` |
| Pagination | `page`, `limit` |

### Roles — `GET /roles`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `roleName`, `description` |
| Advanced | — |
| Pagination | `page`, `limit` |

### Permissions — `GET /permissions`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `actionCode`, `resource`, `description` |
| Advanced | `resource` (exact match) |
| Pagination | `page`, `limit` |

### Customer levels — `GET /customer-levels`

| Type | Parameters |
|------|------------|
| Basic | `q` / `search` — `levelName` |
| Advanced | `minScoreAtLeast` (`min_score >=`), `maxScoreAtMost` (`max_score <=`) |
| Pagination | `page`, `limit` |

---

## Examples

```http
GET /api/v1/customers?q=acme&isActive=true&page=1&limit=20
Authorization: Bearer <token>
```

```http
GET /api/v1/orders?q=42&orderDateFrom=2025-01-01&orderDateTo=2025-12-31
Authorization: Bearer <token>
```

```http
GET /api/v1/tasks?q=follow%20up&status=PENDING&dueDateFrom=2025-03-01&dueDateTo=2025-03-31
Authorization: Bearer <token>
```

## Interactive docs

Open **Swagger UI** at `/api-docs` on the API server for schema details on each route.

## Implementation note

Shared helpers live in `src/utils/search.utils.ts` (`getBasicSearchString`, `orILike`, `parsePagination`, `dateRangeOnField`, etc.).
