# StayHub — Full-Stack MERN Property Rental Platform (Airbnb Clone)

A full-stack vacation rental and property management platform built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and TypeScript. Features complete role-based workflows for **Customers**, **Property Owners/Hosts**, and **Platform Admins**, with real-time booking availability calculation, concurrency double-booking prevention, Razorpay payment processing, and Swagger API documentation.

---

## 🌐 Live Deployment Links

- **Live Frontend (Vercel):** [https://frontend-azure-three-72.vercel.app/]
- **Live Backend API (Render):** [https://airbn-clone-y3zo.onrender.com](https://airbn-clone-y3zo.onrender.com)
- **API Health Check:** [https://airbn-clone-y3zo.onrender.com/health](https://airbn-clone-y3zo.onrender.com/health)
- **Interactive Swagger Docs:** [https://airbn-clone-y3zo.onrender.com/api/docs](https://airbn-clone-y3zo.onrender.com/api/docs)
- **GitHub Repository:** [https://github.com/samarhirau/Airbn-Clone](https://github.com/samarhirau/Airbn-Clone)

---

## 🔑 Demo Login Credentials

Pre-seeded accounts are ready for testing all three system roles:

| Role | Email | Password | Access / Capabilities |
|---|---|---|---|
| **Admin** | `admin@stayhub.dev` | `Admin@12345` | System Health, User Management, Property Approvals, Platform Analytics |
| **Owner / Host** | `owner@stayhub.dev` | `Owner@12345` | Listing Manager, Calendar Occupancy, Host Bookings, Coupons |
| **Customer** | `customer@stayhub.dev` | `Customer@12345` | Search & Filter, Reserve, Razorpay Payment, Trips, Wishlist, Reviews |

---

## ✨ Features

### 1. Customer Experience
- **Search & Advanced Filtering:** Location (city/area), price slider, property type, guest capacity, bedroom count, amenities, and dynamic date availability.
- **Availability & Pricing Calculation:** Automatic computation of nights, base rates, cleaning fees, StayHub service fees, and applied coupon discounts.
- **Strict Concurrency Guard:** Prevents overlapping/double bookings using transactional date range collision queries.
- **Payment & Checkout Flow:** Integrated **Razorpay Checkout** (UPI, Cards, Netbanking) with HMAC-SHA256 signature verification + built-in instant test simulator.
- **My Trips & Bookings:** Filter between upcoming, completed, and cancelled bookings; cancellation workflows; and downloadable receipts.
- **Wishlist & Saved Stays:** Add/remove favorite properties with instant synchronization.
- **Post-Stay Verified Reviews:** Reviews are strictly restricted to customers who have actually completed a stay at the property.

### 2. Owner / Host Suite
- **Listing Management:** Add, edit, activate/deactivate listings with Cloudinary multi-image uploads.
- **Host Calendar & Occupancy:** Interactive visual calendar showing blocked dates, active reservations, and when occupied properties will become available again.
- **Host Bookings Dashboard:** View all incoming guest reservations, earnings breakdowns, and guest details.
- **Promotional Coupons:** Create and manage discount coupons (percentage or fixed discount) with expiry dates and usage limits.
- **Direct Guest Messaging:** In-app conversation thread with reserving guests.

### 3. Admin Control Panel
- **Global Platform Metrics:** Real-time KPI cards for total users, customers, hosts, active properties, total bookings, and platform gross revenue.
- **User & Role Management:** View all registered accounts, change roles, deactivate users.
- **Property Governance:** Monitor active vs. inactive listings across all cities and owners.
- **System Health Monitor:** Real-time diagnostics tracking MongoDB connection status, Redis cluster latency, server uptime, and memory consumption.

### 4. Enterprise Architecture & Security
- **Authentication & Authorization:** Secure JWT access & refresh tokens with bcryptjs password hashing (cost factor 12) and strict backend role guards.
- **Distributed Caching & Rate Limiting:** Redis-backed rate limiting (`ioredis`) protecting against brute force and DDoS.
- **Input Validation:** End-to-end type safety using **Zod** schemas for both API request bodies and route parameters.
- **API Documentation:** OpenAPI 3.0 / Swagger UI documentation accessible at `/api/docs`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v6, Tailwind CSS, Lucide React, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js (v5), TypeScript, Mongoose, Zod, Pino Logger |
| **Database & Cache** | MongoDB Atlas (Replica Set), Redis (Upstash) |
| **Payments** | Razorpay Node.js SDK + Razorpay Checkout.js with HMAC-SHA256 verification |
| **Media & Storage** | Cloudinary v2 API with memory-buffered stream uploads |
| **Documentation & Tooling** | Swagger UI Express, Vitest, Nodemon, ESLint |

---

## 🚀 Setup & Local Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm 
- MongoDB connection string (MongoDB Atlas)
- Redis instance (Upstash Redis)

### 1. Clone the repository
```bash
git clone https://github.com/samarhirau/Airbn-Clone.git
cd Airbn-Clone
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/stayhub?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173

# Redis
REDIS_URL=redis://default:<password>@<host>:6379
REDIS_ENABLED=true

# JWT Secrets (generate 32+ character random strings)
JWT_ACCESS_SECRET=your_super_secret_access_jwt_key_32chars
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_32chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (Optional, fallback mock is active if omitted)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Seed Data Credentials
SEED_ADMIN_EMAIL=admin@stayhub.dev
SEED_ADMIN_PASSWORD=Admin@12345
SEED_OWNER_EMAIL=owner@stayhub.dev
SEED_OWNER_PASSWORD=Owner@12345
SEED_CUSTOMER_EMAIL=customer@stayhub.dev
SEED_CUSTOMER_PASSWORD=Customer@12345
```

Seed initial properties, bookings, and demo users:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
# Server will start on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

Start the Vite development server:
```bash
npm run dev
# App will run on http://localhost:5173
```

---

## 📡 API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register customer / owner | Public |
| `POST` | `/api/auth/login` | Login with credentials | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Customer / Owner / Admin |
| `GET` | `/api/properties` | Search & filter properties | Public |
| `POST` | `/api/properties` | Create new property listing | Owner |
| `GET` | `/api/properties/:id` | Property detail view | Public |
| `PUT` | `/api/properties/:id` | Update property | Owner (Property Host) |
| `DELETE` | `/api/properties/:id` | Deactivate/delete property | Owner (Property Host) |
| `POST` | `/api/bookings` | Reserve property | Customer |
| `GET` | `/api/bookings` | View user bookings | Customer |
| `PUT` | `/api/bookings/:id/cancel`| Cancel booking | Customer / Owner |
| `GET` | `/api/payments/config` | Get public gateway config | Public |
| `POST` | `/api/payments/intent` | Create Razorpay order intent | Customer |
| `POST` | `/api/payments/verify` | Verify Razorpay HMAC signature | Customer |
| `POST` | `/api/reviews` | Submit post-stay review | Customer (Must have completed stay) |
| `GET` | `/api/properties/:id/reviews` | List reviews for property | Public |
| `GET` | `/api/admin/dashboard` | Admin summary metrics | Admin |
| `GET` | `/api/admin/users` | List platform users | Admin |
| `GET` | `/api/admin/properties` | Manage platform listings | Admin |
| `GET` | `/api/admin/bookings` | Manage all bookings | Admin |

Interactive API documentation available at `http://localhost:5000/api/docs`.

---

## 🚢 Deployment Details

- **Frontend:** Hosted on **Vercel** with SPA rewrite rules (`vercel.json`) to handle client-side React Router navigation and prevent 404s on page reload.
- **Backend:** Hosted on **Render** (Node.js web service) with environment configuration, automatic restarts, and health check monitoring at `/health`.
- **Database:** **MongoDB Atlas** M0 shared cluster with connection pooling and replica set support.
- **Redis:** **Upstash Redis** cloud instance providing serverless distributed cache storage.

---

## 📌 Known Limitations / Future Enhancements

- **International Currency Razorpay Processing:** Razorpay orders are currently generated in Indian Rupees (INR) with real-time conversion from base rates, as standard Indian merchant accounts require INR by default.
- **SMS OTP Verification:** Phone numbers are validated via schemas; live SMS OTP integration (e.g. Twilio) can be added as a production add-on.