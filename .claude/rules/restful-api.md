# RESTful API URI Design Rules

Rules for all backend API endpoints (`claude/backend`). These are mandatory when designing or implementing REST API routes.

Sources: Microsoft REST API Guidelines, Google API Design Guide, Zalando RESTful API Guidelines.

## 1. URI Naming

- Use **plural nouns** for collections: `/users`, `/orders`, `/views`
- Use **lowercase** only: `/user-profiles`, never `/UserProfiles`
- Use **hyphens** (`-`) as word separators: `/runtime-bindings`, never `/runtime_bindings`
- **No verbs** in URIs. Operations are expressed via HTTP methods
- **No trailing slashes**: `/api/v1/users`, not `/api/v1/users/`
- ASCII characters only

```
WRONG:  GET  /api/v1/getUsers
WRONG:  POST /api/v1/createModel
WRONG:  GET  /api/v1/user_profiles

RIGHT:  GET  /api/v1/users
RIGHT:  POST /api/v1/models
RIGHT:  GET  /api/v1/user-profiles
```

## 2. Resource Hierarchy

- Nest sub-resources only when the child is **existentially dependent** on the parent
- **Maximum 2 levels** of nesting. Beyond that, flatten with query parameters
- Use the pattern: `/collection/:id/sub-collection/:id`

```
GOOD (1 level):   GET /api/v1/models
GOOD (2 levels):  GET /api/v1/models/:id/elements
GOOD (2 levels):  GET /api/v1/views/:id/layout
AVOID (3 levels): GET /api/v1/models/:id/elements/:id/properties
BETTER:           GET /api/v1/elements/:id/properties
```

For non-dependent relationships, prefer flat endpoints with filtering:
```
Instead of:  GET /api/v1/users/:id/sessions/:id/logs
Prefer:      GET /api/v1/logs?session_id=abc
```

## 3. HTTP Methods

| Method | Purpose | Idempotent | Request Body | Success Code |
|--------|---------|------------|--------------|--------------|
| GET | Retrieve resource(s) | Yes | No | 200 |
| POST | Create resource | No | Yes | 201 |
| PUT | Replace entire resource | Yes | Yes | 200 or 204 |
| PATCH | Partial update | No | Yes | 200 or 204 |
| DELETE | Remove resource | Yes | No | 200 or 204 |

**Collection endpoints:**
```
GET    /api/v1/users           → List users
POST   /api/v1/users           → Create user
```

**Instance endpoints:**
```
GET    /api/v1/users/:id       → Get one user
PUT    /api/v1/users/:id       → Replace user
PATCH  /api/v1/users/:id       → Partial update
DELETE /api/v1/users/:id       → Delete user
```

**Sub-resource endpoints:**
```
GET    /api/v1/models/:id/elements       → List elements in model
POST   /api/v1/models/:id/elements       → Create element in model
GET    /api/v1/models/:id/elements/:eid  → Get specific element
```

## 4. Query Parameters

### Pagination (mandatory for all list endpoints)

Use `limit` + `offset` pattern:
```
GET /api/v1/users?limit=20&offset=40
```

Response must include pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_next": true
  }
}
```

Defaults: `limit=20`, `offset=0`. Maximum `limit=100`.

### Filtering

Use direct query parameters for simple filters:
```
GET /api/v1/events?event_type=process_start&severity=high
GET /api/v1/elements?semantic_type_id=abc&parent_element_id=def
```

For range filters, use suffixed operators:
```
GET /api/v1/events?occurred_at_gte=1700000000000&occurred_at_lte=1700100000000
GET /api/v1/logs?severity_gte=warning
```

### Sorting

Use `sort` parameter with field name, prefix `-` for descending:
```
GET /api/v1/events?sort=-occurred_at
GET /api/v1/users?sort=name,-created_at
```

### Field Selection

Use `fields` parameter to request sparse responses:
```
GET /api/v1/users?fields=id,name,email
```

### Search

Use `q` parameter for full-text search:
```
GET /api/v1/elements?q=web-server
```

## 5. Versioning

Use **URI path versioning**:
```
/api/v1/users
/api/v2/users
```

- All endpoints prefixed with `/api/v1`
- Version bump only for breaking changes
- Support previous version during deprecation period

## 6. Status Codes

### Success

| Code | When |
|------|------|
| 200 OK | GET success, PUT/PATCH with response body |
| 201 Created | POST success. Include `Location` header |
| 204 No Content | DELETE success, PUT/PATCH without response body |

### Client Errors

| Code | When |
|------|------|
| 400 Bad Request | Malformed request, invalid JSON, missing required field |
| 401 Unauthorized | Authentication required but missing or invalid |
| 403 Forbidden | Authenticated but insufficient permissions |
| 404 Not Found | Resource does not exist |
| 409 Conflict | State conflict (duplicate, optimistic concurrency violation) |
| 422 Unprocessable Entity | Valid JSON but semantic validation failed (e.g., containment rule violation) |

### Server Errors

| Code | When |
|------|------|
| 500 Internal Server Error | Unexpected server failure |
| 503 Service Unavailable | Temporary overload or maintenance |

### Error Response Format

All error responses use a consistent structure:
```json
{
  "error": {
    "code": "CONTAINMENT_VIOLATION",
    "message": "ExecutionThread cannot contain child elements",
    "details": {
      "parent_type": "ExecutionThread",
      "child_type": "SoftwareProcess"
    }
  }
}
```

## 7. Singleton Resources

For resources that exist once per context (no collection):
```
GET  /api/v1/me                → Current authenticated user
GET  /api/v1/health            → System health check
GET  /api/v1/agents/:id/state  → Agent's latest self-state (singleton per agent)
```

## 8. Actions and Non-CRUD Operations

When an operation doesn't map cleanly to CRUD, use a **sub-resource noun** representing the result:
```
POST /api/v1/views/:id/copies         → Duplicate a view (not /api/v1/views/:id/copy)
POST /api/v1/metamodels/:id/publish   → Publish metamodel (acceptable: state transition)
POST /api/v1/views/:id/lock           → Acquire edit lock
DELETE /api/v1/views/:id/lock         → Release edit lock
```

State transitions are the one exception where a verb-like sub-resource is acceptable.

## 9. Batch Operations

For agent batch ingest and similar bulk operations:
```
POST /api/v1/agents/:id/batch
```

Response for mixed success/failure uses **207 Multi-Status**:
```json
{
  "ack_seq": 42,
  "accepted_count": 8,
  "server_time": 1700000000000,
  "errors": [
    { "seq": 35, "code": "DUPLICATE", "message": "Already processed" }
  ]
}
```

For long-running batch operations, return **202 Accepted** with a status URL.

## 10. Anti-Patterns (NEVER do these)

```
NEVER:  GET  /api/v1/getUsers                    → verb in URI
NEVER:  POST /api/v1/user/create                 → CRUD verb in URI
NEVER:  GET  /api/v1/users/123/delete             → DELETE via GET
NEVER:  POST /api/v1?action=deleteUser&id=123    → RPC tunneling
NEVER:  GET  /api/v1/user                         → singular collection name
NEVER:  GET  /api/v1/Users                        → uppercase
NEVER:  GET  /api/v1/user_profiles                → underscore in URI
```

## Checklist

Before finalizing any API endpoint, verify:

- [ ] URI uses plural nouns, lowercase, hyphens
- [ ] No verbs in URI path
- [ ] Nesting depth is 2 levels or fewer
- [ ] Correct HTTP method for the operation
- [ ] List endpoints have pagination (limit/offset)
- [ ] Appropriate status codes for success and error cases
- [ ] Error responses follow the standard error format
- [ ] Version prefix (`/api/v1`) is present
