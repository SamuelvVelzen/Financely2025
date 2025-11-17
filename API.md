# API Documentation

This document describes all available API endpoints for the Financely application.

## Base URL

All endpoints are prefixed with `/api/v1`.

## Authentication

All endpoints require authentication. The authentication mechanism is handled via the `withAuth` middleware. Unauthenticated requests will receive a `401 Unauthorized` response.

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional error details
    }
  }
}
```

### Error Codes

- `UNAUTHORIZED` (401) - Authentication required
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Request validation failed
- `CONFLICT` (409) - Resource conflict (e.g., duplicate name)
- `INTERNAL_ERROR` (500) - Server error

### Validation Errors

When validation fails, the `details` field contains validation issues:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "issues": [
        {
          "path": ["fieldName"],
          "message": "Error message"
        }
      ]
    }
  }
}
```

## Data Types

### Currency

Enum values: `USD`, `EUR`, `GBP`, `CAD`, `AUD`, `JPY`

### TransactionType

Enum values: `EXPENSE`, `INCOME`

### Date Format

All dates are ISO 8601 strings (e.g., `"2024-01-15T10:30:00.000Z"`).

### Decimal Format

Amounts are represented as strings to preserve precision (e.g., `"123.45"`).

---

## Endpoints

### User

#### Get Current User

Returns the currently authenticated user.

**Endpoint:** `GET /api/v1/me`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "id": "string",
  "email": "string",
  "name": "string | null",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - User not found

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/v1/me
```

**Example Response:**

```json
{
  "id": "clx1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Tags

#### List Tags

List all tags for the authenticated user with optional filtering and sorting.

**Endpoint:** `GET /api/v1/tags`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Default    | Description                           |
| --------- | ------ | -------- | ---------- | ------------------------------------- |
| `q`       | string | No       | -          | Search query to filter tags by name   |
| `sort`    | string | No       | `name:asc` | Sort order: `name:asc` or `name:desc` |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "color": "string | null",
      "description": "string | null",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/tags?q=groceries&sort=name:asc"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "name": "Groceries",
      "color": "#FF6600",
      "description": "Weekly grocery shopping",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Create Tag

Create a new tag for the authenticated user.

**Endpoint:** `POST /api/v1/tags`

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string (1-100 chars)",
  "color": "string (hex color, e.g., #FF6600) | null",
  "description": "string (max 500 chars) | null"
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "name": "string",
  "color": "string | null",
  "description": "string | null",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `409 Conflict` - Tag with this name already exists

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/tags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Groceries",
    "color": "#FF6600",
    "description": "Weekly grocery shopping"
  }'
```

**Example Response:**

```json
{
  "id": "clx1234567890",
  "name": "Groceries",
  "color": "#FF6600",
  "description": "Weekly grocery shopping",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Update Tag

Update an existing tag.

**Endpoint:** `PATCH /api/v1/tags/:tagId`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `tagId`   | string | Yes      | The tag identifier |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (1-100 chars)",
  "color": "string (hex color, e.g., #FF6600) | null",
  "description": "string (max 500 chars) | null"
}
```

**Response:** `200 OK`

```json
{
  "id": "string",
  "name": "string",
  "color": "string | null",
  "description": "string | null",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `404 Not Found` - Tag not found
- `409 Conflict` - Tag with this name already exists

**Example Request:**

```bash
curl -X PATCH http://localhost:3000/api/v1/tags/clx1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#00FF00",
    "description": "Updated description"
  }'
```

#### Delete Tag

Delete a tag.

**Endpoint:** `DELETE /api/v1/tags/:tagId`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `tagId`   | string | Yes      | The tag identifier |

**Response:** `200 OK`

```json
{
  "success": true
}
```

**Error Responses:**

- `404 Not Found` - Tag not found

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/api/v1/tags/clx1234567890
```

---

### Transactions

#### List Transactions

List transactions for the authenticated user with pagination, filtering, and sorting.

**Endpoint:** `GET /api/v1/transactions`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type            | Required | Default           | Description                                                                  |
| --------- | --------------- | -------- | ----------------- | ---------------------------------------------------------------------------- | ------------------ | ---------------- | ----- |
| `page`    | number          | No       | `1`               | Page number (min: 1)                                                         |
| `limit`   | number          | No       | `20`              | Items per page (min: 1, max: 100)                                            |
| `from`    | ISO date string | No       | -                 | Filter transactions from this date (inclusive)                               |
| `to`      | ISO date string | No       | -                 | Filter transactions to this date (inclusive)                                 |
| `type`    | TransactionType | No       | -                 | Filter by transaction type: `EXPENSE` or `INCOME`                            |
| `tagIds`  | string[]        | No       | -                 | Filter by tag IDs (can be provided multiple times: `?tagIds=id1&tagIds=id2`) |
| `q`       | string          | No       | -                 | Search query to filter by name or description                                |
| `sort`    | string          | No       | `occurredAt:desc` | Sort order: `occurredAt:asc                                                  | desc`, `amount:asc | desc`, `name:asc | desc` |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "string",
      "type": "EXPENSE | INCOME",
      "amount": "string",
      "currency": "USD | EUR | GBP | CAD | AUD | JPY",
      "occurredAt": "2024-01-15T10:30:00.000Z",
      "name": "string",
      "description": "string | null",
      "externalId": "string | null",
      "tags": [
        {
          "id": "string",
          "name": "string"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 100,
  "hasNext": true
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/transactions?page=1&limit=10&type=EXPENSE&from=2024-01-01T00:00:00.000Z&sort=occurredAt:desc"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "type": "EXPENSE",
      "amount": "123.45",
      "currency": "USD",
      "occurredAt": "2024-01-15T10:30:00.000Z",
      "name": "Grocery Store",
      "description": "Weekly shopping",
      "externalId": null,
      "tags": [
        {
          "id": "clx9876543210",
          "name": "Groceries"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 50,
  "hasNext": true
}
```

#### Create Transaction

Create a new transaction.

**Endpoint:** `POST /api/v1/transactions`

**Authentication:** Required

**Request Body:**

```json
{
  "type": "EXPENSE | INCOME",
  "amount": "string (decimal)",
  "currency": "USD | EUR | GBP | CAD | AUD | JPY",
  "occurredAt": "2024-01-15T10:30:00.000Z",
  "name": "string (1-200 chars)",
  "description": "string (max 1000 chars) | null",
  "externalId": "string (max 200 chars) | null",
  "tagIds": ["string"] (optional, default: [])
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "type": "EXPENSE | INCOME",
  "amount": "string",
  "currency": "USD | EUR | GBP | CAD | AUD | JPY",
  "occurredAt": "2024-01-15T10:30:00.000Z",
  "name": "string",
  "description": "string | null",
  "externalId": "string | null",
  "tags": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `404 Not Found` - One or more tags not found

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPENSE",
    "amount": "123.45",
    "currency": "USD",
    "occurredAt": "2024-01-15T10:30:00.000Z",
    "name": "Grocery Store",
    "description": "Weekly shopping",
    "tagIds": ["clx9876543210"]
  }'
```

#### Update Transaction

Update an existing transaction.

**Endpoint:** `PATCH /api/v1/transactions/:transactionId`

**Authentication:** Required

**Path Parameters:**

| Parameter       | Type   | Required | Description                |
| --------------- | ------ | -------- | -------------------------- |
| `transactionId` | string | Yes      | The transaction identifier |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "type": "EXPENSE | INCOME",
  "amount": "string (decimal)",
  "currency": "USD | EUR | GBP | CAD | AUD | JPY",
  "occurredAt": "2024-01-15T10:30:00.000Z",
  "name": "string (1-200 chars)",
  "description": "string (max 1000 chars) | null",
  "externalId": "string (max 200 chars) | null",
  "tagIds": ["string"]
}
```

**Note:** When updating `tagIds`, the entire tag list is replaced with the provided array.

**Response:** `200 OK`

```json
{
  "id": "string",
  "type": "EXPENSE | INCOME",
  "amount": "string",
  "currency": "USD | EUR | GBP | CAD | AUD | JPY",
  "occurredAt": "2024-01-15T10:30:00.000Z",
  "name": "string",
  "description": "string | null",
  "externalId": "string | null",
  "tags": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
- `404 Not Found` - Transaction not found or one or more tags not found

**Example Request:**

```bash
curl -X PATCH http://localhost:3000/api/v1/transactions/clx1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "150.00",
    "description": "Updated description"
  }'
```

#### Delete Transaction

Delete a transaction.

**Endpoint:** `DELETE /api/v1/transactions/:transactionId`

**Authentication:** Required

**Path Parameters:**

| Parameter       | Type   | Required | Description                |
| --------------- | ------ | -------- | -------------------------- |
| `transactionId` | string | Yes      | The transaction identifier |

**Response:** `200 OK`

```json
{
  "success": true
}
```

**Error Responses:**

- `404 Not Found` - Transaction not found

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/api/v1/transactions/clx1234567890
```

#### Add Tag to Transaction

Add a tag to an existing transaction.

**Endpoint:** `POST /api/v1/transactions/:transactionId/tags/:tagId`

**Authentication:** Required

**Path Parameters:**

| Parameter       | Type   | Required | Description                |
| --------------- | ------ | -------- | -------------------------- |
| `transactionId` | string | Yes      | The transaction identifier |
| `tagId`         | string | Yes      | The tag identifier         |

**Response:** `200 OK`

Returns the updated transaction:

```json
{
  "id": "string",
  "type": "EXPENSE | INCOME",
  "amount": "string",
  "currency": "USD | EUR | GBP | CAD | AUD | JPY",
  "occurredAt": "2024-01-15T10:30:00.000Z",
  "name": "string",
  "description": "string | null",
  "externalId": "string | null",
  "tags": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Transaction not found or tag not found

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/transactions/clx1234567890/tags/clx9876543210
```

#### Remove Tag from Transaction

Remove a tag from an existing transaction.

**Endpoint:** `DELETE /api/v1/transactions/:transactionId/tags/:tagId`

**Authentication:** Required

**Path Parameters:**

| Parameter       | Type   | Required | Description                |
| --------------- | ------ | -------- | -------------------------- |
| `transactionId` | string | Yes      | The transaction identifier |
| `tagId`         | string | Yes      | The tag identifier         |

**Response:** `200 OK`

Returns the updated transaction:

```json
{
  "id": "string",
  "type": "EXPENSE | INCOME",
  "amount": "string",
  "currency": "USD | EUR | GBP | CAD | AUD | JPY",
  "occurredAt": "2024-01-15T10:30:00.000Z",
  "name": "string",
  "description": "string | null",
  "externalId": "string | null",
  "tags": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Transaction not found or tag not found

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/api/v1/transactions/clx1234567890/tags/clx9876543210
```

---

## Notes

### User Scoping

All resources (tags, transactions) are scoped to the authenticated user. Users can only access and modify their own resources.

### Tag Uniqueness

Tag names must be unique per user. Attempting to create a tag with a name that already exists for the user will result in a `409 Conflict` error.

### Transaction-Tag Relationships

- Transactions can have multiple tags
- Tags can be associated with multiple transactions
- When updating a transaction's `tagIds`, the entire tag list is replaced
- Use the tag management endpoints (`POST`/`DELETE /api/v1/transactions/:id/tags/:tagId`) to add or remove individual tags without replacing the entire list

### Pagination

The transactions list endpoint supports pagination. Use the `page` and `limit` query parameters. The response includes:

- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items
- `hasNext`: Whether there are more pages

### Sorting

- **Tags**: Can be sorted by `name` in ascending or descending order
- **Transactions**: Can be sorted by `occurredAt`, `amount`, or `name` in ascending or descending order

### Date Filtering

When filtering transactions by date range:

- `from`: Inclusive start date
- `to`: Inclusive end date
- Both dates should be ISO 8601 strings

### Search

- **Tags**: Search by name (case-insensitive partial match)
- **Transactions**: Search by name or description (case-insensitive partial match)
