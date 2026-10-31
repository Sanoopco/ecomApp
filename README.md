# 🛒 E-Commerce REST API

A production-ready RESTful API for an e-commerce platform built with **Node.js**, **Express 5**, and **MongoDB (Mongoose)**. Supports customer and admin roles, full product/category/order management, JWT authentication, and atomic stock operations via database transactions.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Seed Admin User](#seed-admin-user)
  - [Run the Server](#run-the-server)
- [API Reference](#-api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Categories](#categories)
  - [Products](#products)
  - [Orders](#orders)
- [Authentication](#-authentication)
- [Error Handling](#-error-handling)
- [Scripts](#-scripts)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, login, and protected routes
- 👥 **Role-based access control** — `customer` and `admin` roles
- 📦 **Product management** — CRUD, SKU tracking, sale prices, stock management
- 🗂️ **Category management** — Unlimited nested hierarchy with circular-reference protection
- 🛍️ **Order management** — Atomic stock deduction using MongoDB transactions, order status lifecycle
- ✅ **Input validation** — Zod v4 schemas with `.strict()` on all endpoints
- 🔒 **Security** — Helmet headers, bcrypt (salt rounds 12), CORS, 100kb request limit
- 📄 **Pagination** — All list endpoints support `page` and `limit` query params

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM, `"type":"module"`) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcrypt` (salt rounds: 12) |
| Validation | Zod v4 |
| Security headers | Helmet |
| Dev server | Nodemon |
| Testing | Jest + Supertest |

---

## 📁 Project Structure

```
ecommerce-api/
├── .env.example              # Environment variable template
├── .gitignore
├── package.json
└── src/
    ├── server.js             # Entry point — starts server after DB connects
    ├── app.js                # Express app (middleware, routes, error handler)
    ├── config/
    │   └── database.js       # Mongoose connection
    ├── controllers/
    │   ├── auth.controllers.js
    │   ├── category.controllers.js
    │   ├── order.controllers.js
    │   ├── product.controllers.js
    │   └── user.controllers.js
    ├── middleware/
    │   ├── auth.middleware.js  # protect + adminOnly guards
    │   └── validate.js         # Zod schema validation middleware
    ├── models/
    │   ├── Category.js
    │   ├── Order.js
    │   ├── Product.js
    │   └── User.js
    ├── routes/
    │   ├── index.js
    │   ├── auth.routes.js
    │   ├── category.routes.js
    │   ├── order.routes.js
    │   ├── product.routes.js
    │   └── user.routes.js
    ├── scripts/
    │   └── seedAdmin.js        # One-time admin seeder
    ├── utils/
    │   ├── category.utils.js   # Shared getDescendantIds helper
    │   └── jwt.utils.js        # generateToken helper
    ├── validators/
    │   ├── auth.validator.js
    │   ├── category.validator.js
    │   ├── order.validator.js
    │   ├── product.validator.js
    │   └── user.validator.js
    ├── services/               # (reserved for future business logic)
    └── tests/                  # (reserved for Jest test suites)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** v6 or higher (local or Atlas)
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ecommerce-api

# 2. Install dependencies
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ecommerce` |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) | `your-strong-secret-here` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `1h` |
| `ADMIN_NAME` | Name of the seeded admin user | `Admin` |
| `ADMIN_EMAIL` | Email of the seeded admin user | `admin@example.com` |
| `ADMIN_PASSWORD` | Password of the seeded admin user | `Admin@12345` |

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

### Seed Admin User

Before your first login, create the initial admin account:

```bash
npm run seed:admin
```

This is safe to run multiple times — it skips creation if the admin email already exists.

### Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will be available at `http://localhost:5000`.

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

All responses follow this structure:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... }
}
```

---

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new customer account |
| `POST` | `/auth/login` | Public | Login and receive a JWT token |
| `GET` | `/auth/profile` | Protected | Get the authenticated user's profile |

#### POST `/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "MyPass@123",
  "repassword": "MyPass@123"
}
```

#### POST `/auth/login`
```json
{
  "email": "jane@example.com",
  "password": "MyPass@123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt-token>",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "customer" }
}
```

---

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List all users |
| `GET` | `/users/:id` | Admin | Get a specific user |
| `PATCH` | `/users/profile` | Protected | Update own name / email |
| `PATCH` | `/users/:id/status` | Admin | Activate or deactivate a user |

#### PATCH `/users/profile`
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

#### PATCH `/users/:id/status`
```json
{ "isActive": false }
```

---

### Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | List all active categories (flat) |
| `GET` | `/categories/tree` | Public | Get full nested category tree |
| `GET` | `/categories/:id` | Public | Get a single category |
| `POST` | `/categories` | Admin | Create a new category |
| `PUT` | `/categories/:id` | Admin | Update a category |
| `DELETE` | `/categories/:id` | Admin | Delete a category (blocked if products exist) |

#### POST `/categories`
```json
{
  "name": "Electronics",
  "description": "Gadgets and devices",
  "parent": null
}
```

#### PUT `/categories/:id`
```json
{
  "name": "Consumer Electronics",
  "isActive": true
}
```

> Categories with products assigned (or any descendant with products) **cannot** be deleted. Soft-delete a category by setting `"isActive": false` via PUT.

---

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products` | Public | Search, filter, sort and paginate products |
| `GET` | `/products/:id` | Public | Get a single active product |
| `POST` | `/products` | Admin | Create a new product |
| `PUT` | `/products/:id` | Admin | Update a product |
| `DELETE` | `/products/:id` | Admin | Delete a product |

#### GET `/products` — Query Parameters

| Param | Type | Description |
|---|---|---|
| `search` | string | Full-text search on name and description |
| `category` | ObjectId | Filter by category (includes all descendants) |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `sort` | string | `newest` \| `oldest` \| `price_asc` \| `price_desc` \| `name_asc` \| `name_desc` |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Results per page (default: `10`, max: `100`) |

#### POST `/products`
```json
{
  "name": "Wireless Headphones",
  "sku": "WH-1000XM5",
  "description": "Noise cancelling over-ear headphones",
  "price": 349.99,
  "salePrice": 299.99,
  "stock": 50,
  "category": "<category-objectid>",
  "status": "active"
}
```

---

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders` | Protected | Place a new order |
| `GET` | `/orders/my-orders` | Protected | Get own order history (paginated) |
| `GET` | `/orders` | Admin | Get all orders (filterable by status) |
| `GET` | `/orders/:id` | Protected | Get order by ID (own orders or admin) |
| `PATCH` | `/orders/:id/status` | Admin | Update order status |

#### POST `/orders`
```json
{
  "items": [
    { "productId": "<product-objectid>", "quantity": 2 },
    { "productId": "<product-objectid>", "quantity": 1 }
  ]
}
```
> Stock is deducted **atomically** inside a MongoDB transaction. If any item is out of stock, the entire order is rolled back.

#### PATCH `/orders/:id/status`
```json
{ "status": "shipped" }
```

**Order status lifecycle:**

```
pending → confirmed → processing → shipped → delivered
                                             ↑
                      cancelled ────────────┘  (from any non-terminal state)
```

> Once an order reaches `delivered` or `cancelled`, its status **cannot be changed**. Cancelling an order automatically **restores stock** for all items.

---

## 🔐 Authentication

Protected routes require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default: `1h`).

---

## ⚠️ Error Handling

All errors return a consistent JSON shape:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Missing or invalid authentication token |
| `403` | Authenticated but insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email, insufficient stock) |
| `500` | Internal server error |

Validation errors include a detailed `errors` array:

```json
{
  "success": false,
  "message": "Invalid request body",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Nodemon (auto-reload) |
| `npm start` | Start production server |
| `npm run seed:admin` | Seed the initial admin user from `.env` values |
| `npm test` | Run Jest test suites |

---

## 📄 License

ISC
