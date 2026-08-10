# Flash Sale & Ticket Booking System — Full Project Reference

Use this document to understand, build, or extend the Flash Sale & Ticket Booking System. It covers the full architecture, feature set, folder structure, data models, API contracts, Redis/locking design, and implementation instructions. Feed this to any AI agent to get accurate, context-aware help.

---

## 1. Project Overview

The Flash Sale & Ticket Booking System is a concurrency-first platform where users book limited-inventory seats (concert tickets, event seats) under high simultaneous demand. The system is engineered around a real distributed-systems problem — preventing overselling when hundreds of users compete for the same seats within seconds — using Redis-based distributed locking, atomic inventory counters, TTL-based holds, and Resilience4j fault tolerance around the payment path.

### Core Features
- JWT-based authentication (User / Organizer / Admin roles)
- Browse events with filters (category, date, city, price)
- Visual seat map selection with live availability
- Distributed-lock seat reservation with a time-bound hold (auto-releases if payment isn't completed)
- Real payment integration (Razorpay sandbox) with server-side signature verification and idempotency keys
- FIFO waitlist for sold-out events, backed by a Redis sorted set, with auto-promotion
- Organizer dashboard: create/manage events, seat maps, view sales
- Admin dashboard: fraud/rate-limit visibility, user management
- Booking cancellation + refund flow
- Fault-tolerant payment path via Resilience4j (circuit breaker, retry, bulkhead, rate limiter)

---

## 2. Tech Stack

### Frontend

| Purpose | Library/Tool |
|---|---|
| UI Framework | React 18 (Vite) |
| Routing | React Router v6 |
| Global State | Context API (Auth) |
| Server State / Data Fetching | TanStack Query (React Query v5) |
| Forms | React Hook Form + Zod (validation) |
| HTTP Client | Axios (with JWT interceptor) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| Payment UI | Razorpay Checkout.js (embedded) |
| Deployment | Vercel |

### Backend

| Purpose | Library/Tool |
|---|---|
| Runtime | Java 17+ |
| Framework | Spring Boot 3.x |
| Database | PostgreSQL (source of truth) |
| Cache / Locking | Redis + Redisson (distributed locks, TTL holds, atomic counters, ZSET waitlist) |
| ORM | Spring Data JPA (Hibernate) |
| Auth | Spring Security + JWT (jjwt library) |
| Resilience | Resilience4j (Circuit Breaker, Retry, Bulkhead, Rate Limiter, Time Limiter) |
| Validation | Jakarta Bean Validation (`@Valid`, `@NotBlank`, etc.) |
| Payments | Razorpay Java SDK (sandbox/test mode) |
| Migrations | Flyway |
| Build Tool | Maven |
| Testing | JUnit 5, Testcontainers (Redis + Postgres), k6 (load testing) |
| Deployment | Render / Railway (backend), Upstash (managed Redis) |

### External Services

| Service | Purpose |
|---|---|
| Razorpay (test mode) | Order creation, checkout, payment verification, webhooks |
| Redis (Upstash free tier or local) | Distributed locking, inventory counters, TTL holds, waitlist |
| PostgreSQL (Render/Railway/Neon) | Persistent data storage |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│                                                                │
│  Pages: Landing, Events, EventDetail, SeatSelection,          │
│         BookingSummary, Payment, Confirmation, MyBookings,    │
│         OrganizerDashboard, AdminDashboard                    │
│                                                                │
│  Auth Context: user, role, jwt, login, logout                 │
│  React Query: events, seats, bookings, waitlist                │
│  Axios Instance: baseURL + Authorization header                │
└────────────────────────┬───────────────────────────────────────┘
                          │  REST (JSON)
                          │
              ┌───────────▼────────────────────────────────────┐
              │              Spring Boot Backend                  │
              │                                                    │
              │  Controllers → Services → Repositories             │
              │                                                    │
              │  POST   /api/auth/register                         │
              │  POST   /api/auth/login                            │
              │  GET    /api/events                                │
              │  GET    /api/events/{id}                           │
              │  GET    /api/events/{id}/seats                     │
              │  POST   /api/bookings/hold        (acquire lock)   │
              │  POST   /api/bookings/{id}/confirm (after payment) │
              │  POST   /api/payments/create-order                 │
              │  POST   /api/payments/verify                       │
              │  POST   /api/payments/webhook                      │
              │  POST   /api/waitlist/{eventId}/join                │
              │  GET    /api/bookings/my                            │
              │  POST   /api/bookings/{id}/cancel                   │
              │  POST   /api/organizer/events        (organizer)    │
              │  GET    /api/admin/rate-limit-events  (admin)       │
              └───────────┬───────────────────┬────────────────────┘
                          │                   │
              ┌───────────▼──────────┐ ┌──────▼──────────────┐
              │       PostgreSQL      │ │        Redis          │
              │  users, events,       │ │  seat locks (RLock)   │
              │  seats, bookings,     │ │  inventory counters   │
              │  payments,            │ │  TTL holds             │
              │  waitlist_entries     │ │  waitlist ZSET          │
              └───────────────────────┘ └────────────────────────┘
                                   │
                          ┌────────▼─────────┐
                          │     Razorpay      │
                          │  (sandbox mode)   │
                          │  wrapped in       │
                          │  Resilience4j     │
                          └───────────────────┘
```

### Key Design Decision

The seat-locking logic is **not** a database transaction alone — it's a Redis-first design: **Redisson `RLock`** acquires a per-seat distributed lock (works correctly across multiple app instances, unlike `synchronized`), an **atomic `DECR`** on a Redis counter reduces available inventory in one indivisible step, and a **TTL-based hold key** (`EX 300`) reserves the seat for 5 minutes without needing a cron job to release abandoned holds — Redis's own expiry mechanism does that for free. Only after payment is verified does the booking get persisted durably to PostgreSQL. This keeps the hot path (the actual race-condition-prone moment) entirely in Redis, and only writes to the relational database once, on confirmed success — a realistic, interview-defensible alternative to naive `SELECT`-then-`UPDATE` locking, which oversells under concurrent load.

---

## 4. Folder Structure

### Frontend (`/client`)

```
client/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js                    # Axios instance with baseURL + JWT interceptor
│   ├── components/
│   │   ├── ui/                         # shadcn/ui — auto-generated
│   │   │   ├── button.jsx              # npx shadcn@latest add button
│   │   │   ├── card.jsx                # npx shadcn@latest add card
│   │   │   ├── dialog.jsx              # npx shadcn@latest add dialog
│   │   │   ├── badge.jsx               # npx shadcn@latest add badge
│   │   │   ├── select.jsx              # npx shadcn@latest add select
│   │   │   ├── tabs.jsx                # npx shadcn@latest add tabs
│   │   │   └── skeleton.jsx            # npx shadcn@latest add skeleton
│   │   ├── events/
│   │   │   ├── EventCard.jsx               # uses Card, Badge
│   │   │   ├── EventFilters.jsx            # uses Select, Input
│   │   │   └── EventForm.jsx               # organizer create/edit
│   │   ├── seats/
│   │   │   ├── SeatMap.jsx                 # visual, clickable seat grid
│   │   │   ├── SeatLegend.jsx              # available/held/sold color key
│   │   │   └── HoldCountdown.jsx           # live TTL countdown timer
│   │   ├── booking/
│   │   │   ├── BookingSummary.jsx
│   │   │   ├── PromoCodeInput.jsx
│   │   │   └── RazorpayCheckout.jsx        # wraps Razorpay Checkout.js
│   │   ├── waitlist/
│   │   │   └── WaitlistStatus.jsx          # "You're #4 in line"
│   │   ├── organizer/
│   │   │   ├── SeatMapBuilder.jsx
│   │   │   └── SalesOverview.jsx
│   │   ├── admin/
│   │   │   └── RateLimitDashboard.jsx
│   │   └── shared/
│   │       ├── Navbar.jsx
│   │       ├── ProtectedRoute.jsx
│   │       ├── OrganizerRoute.jsx
│   │       ├── AdminRoute.jsx
│   │       └── LoadingSkeleton.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── HowItWorks.jsx                  # animated onboarding page
│   │   ├── About.jsx                       # project insights page
│   │   ├── Events.jsx                      # listing + filters
│   │   ├── EventDetail.jsx
│   │   ├── SeatSelection.jsx
│   │   ├── BookingSummary.jsx
│   │   ├── Payment.jsx
│   │   ├── Confirmation.jsx
│   │   ├── PaymentFailed.jsx
│   │   ├── MyBookings.jsx
│   │   ├── BookingDetail.jsx
│   │   ├── WaitlistStatus.jsx
│   │   ├── Profile.jsx
│   │   ├── OrganizerDashboard.jsx
│   │   ├── CreateEditEvent.jsx
│   │   ├── CheckIn.jsx                     # QR scan simulation
│   │   ├── AdminDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── SeatMapBuilder.jsx               # organizer: define venue seat layout
│   │   ├── SoldOut.jsx
│   │   ├── SessionExpired.jsx
│   │   └── NotFound.jsx
│   ├── context/
│   │   └── AuthContext.jsx                 # user, jwt, role, login, logout, register
│   ├── hooks/
│   │   ├── useEvents.js                    # React Query: list/filter events
│   │   ├── useEvent.js                     # React Query: single event + seats
│   │   ├── useHoldSeat.js                  # React Query mutation: acquire hold
│   │   ├── useBookings.js                  # React Query: user's bookings
│   │   └── useWaitlist.js                  # React Query: waitlist position
│   ├── utils/
│   │   └── constants.js                    # categories, statuses, enums
│   ├── App.jsx                             # Router setup
│   └── main.jsx
├── .env
└── package.json
```

### Backend (`/server`)

```
server/
├── src/main/java/com/flashbook/
│   ├── config/
│   │   ├── SecurityConfig.java             # Spring Security filter chain, CORS, role rules
│   │   ├── JwtAuthFilter.java               # Reads/validates JWT, sets SecurityContext
│   │   ├── RedisConfig.java                 # RedissonClient bean, connection config
│   │   └── Resilience4jConfig.java          # CircuitBreaker/Retry/Bulkhead registries
│   ├── entity/
│   │   ├── User.java
│   │   ├── Event.java
│   │   ├── Venue.java
│   │   ├── Seat.java
│   │   ├── Booking.java
│   │   ├── Payment.java
│   │   └── WaitlistEntry.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── EventRepository.java
│   │   ├── SeatRepository.java
│   │   ├── BookingRepository.java
│   │   └── PaymentRepository.java
│   ├── dto/
│   │   ├── auth/
│   │   │   ├── RegisterRequest.java
│   │   │   ├── LoginRequest.java
│   │   │   └── AuthResponse.java
│   │   ├── event/
│   │   │   ├── EventRequest.java
│   │   │   ├── EventResponse.java
│   │   │   └── EventFilterParams.java
│   │   ├── booking/
│   │   │   ├── HoldRequest.java
│   │   │   ├── HoldResponse.java
│   │   │   └── BookingResponse.java
│   │   └── payment/
│   │       ├── CreateOrderRequest.java
│   │       ├── VerifyPaymentRequest.java
│   │       └── PaymentResponse.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── EventController.java
│   │   ├── BookingController.java
│   │   ├── PaymentController.java
│   │   ├── WaitlistController.java
│   │   ├── OrganizerController.java
│   │   └── AdminController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── EventService.java
│   │   ├── SeatLockService.java             # Core: Redisson RLock + DECR + TTL hold
│   │   ├── BookingService.java
│   │   ├── PaymentService.java              # Razorpay + Resilience4j wrapped calls
│   │   ├── WaitlistService.java             # Redis ZSET operations
│   │   └── NotificationService.java
│   ├── security/
│   │   ├── JwtUtil.java
│   │   └── CustomUserDetailsService.java
│   ├── exception/
│   │   ├── SeatUnavailableException.java
│   │   ├── PaymentVerificationException.java
│   │   └── GlobalExceptionHandler.java      # @ControllerAdvice
│   └── FlashBookApplication.java
├── src/main/resources/
│   ├── application.properties
│   ├── application-dev.properties
│   └── db/migration/                        # Flyway scripts
│       ├── V1__init_schema.sql
│       └── V2__add_indexes.sql
├── pom.xml
└── .env
```

---

## 5. Environment Variables / Configuration

### Frontend (`client/.env`)

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### Backend (`server/src/main/resources/application.properties`)

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/flashbook
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Redis
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}

# JWT
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=604800000

# Razorpay
razorpay.key-id=${RAZORPAY_KEY_ID}
razorpay.key-secret=${RAZORPAY_KEY_SECRET}
razorpay.webhook-secret=${RAZORPAY_WEBHOOK_SECRET}

# Seat hold
booking.hold-ttl-seconds=300

# Resilience4j - payment circuit breaker
resilience4j.circuitbreaker.instances.paymentService.failure-rate-threshold=50
resilience4j.circuitbreaker.instances.paymentService.sliding-window-size=10
resilience4j.circuitbreaker.instances.paymentService.wait-duration-in-open-state=15s
resilience4j.retry.instances.paymentService.max-attempts=3
resilience4j.retry.instances.paymentService.wait-duration=500ms
resilience4j.ratelimiter.instances.bookingEndpoint.limit-for-period=5
resilience4j.ratelimiter.instances.bookingEndpoint.limit-refresh-period=1s

# CORS
app.cors.allowed-origins=http://localhost:5173
```

---

## 6. Data Models (JPA Entities)

### User Entity (`entity/User.java`)

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;        // BCrypt hashed

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;              // USER, ORGANIZER, ADMIN

    @CreationTimestamp
    private Instant createdAt;
}

public enum Role { USER, ORGANIZER, ADMIN }
```

### Venue Entity (`entity/Venue.java`)

```java
@Entity
@Table(name = "venues")
public class Venue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Integer totalCapacity;

    @CreationTimestamp
    private Instant createdAt;
}
```

### Event Entity (`entity/Event.java`)

```java
@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(nullable = false)
    private Instant startTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;      // DRAFT, PUBLISHED, SOLD_OUT, CLOSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @CreationTimestamp
    private Instant createdAt;
}

public enum EventStatus { DRAFT, PUBLISHED, SOLD_OUT, CLOSED }
```

### Seat Entity (`entity/Seat.java`)

```java
@Entity
@Table(name = "seats")
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String seatLabel;        // e.g. "A12"

    @Column(nullable = false)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatStatus status;       // AVAILABLE, HELD, SOLD
}

public enum SeatStatus { AVAILABLE, HELD, SOLD }
```

### Booking Entity (`entity/Booking.java`)

```java
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToMany
    @JoinTable(name = "booking_seats",
        joinColumns = @JoinColumn(name = "booking_id"),
        inverseJoinColumns = @JoinColumn(name = "seat_id"))
    private List<Seat> seats;

    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;     // HELD, CONFIRMED, CANCELLED, EXPIRED

    @CreationTimestamp
    private Instant createdAt;
}

public enum BookingStatus { HELD, CONFIRMED, CANCELLED, EXPIRED }
```

### Payment Entity (`entity/Payment.java`)

```java
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String razorpayOrderId;

    @Column
    private String razorpayPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;      // CREATED, SUCCESS, FAILED, REFUNDED

    @CreationTimestamp
    private Instant createdAt;
}

public enum PaymentStatus { CREATED, SUCCESS, FAILED, REFUNDED }
```

### WaitlistEntry Entity (`entity/WaitlistEntry.java`)

Primarily a Postgres audit trail — the live, operational waitlist state lives in Redis (ZSET, see Section 8). This table exists so waitlist history survives a Redis flush and can be queried for analytics.

```java
@Entity
@Table(name = "waitlist_entries")
public class WaitlistEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    private Instant joinedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WaitlistStatus status;    // WAITING, PROMOTED, EXPIRED

    private Instant promotedAt;
}

public enum WaitlistStatus { WAITING, PROMOTED, EXPIRED }
```

---

## 7. Seat Locking Logic (`service/SeatLockService.java`)

### Trigger
Called from `BookingController.holdSeats()` when a user attempts to reserve seats — this is the hot path where the race condition lives.

### Algorithm (Redis-first, DB-second)

```
1. For each requested seat, acquire a Redisson RLock: "seat:{eventId}:{seatId}"
   - tryLock(waitTime=2s, leaseTime=30s) — fails fast if another request already holds it
2. Inside the lock: check Redis inventory counter via GET, then atomically DECR
   - If resulting count < 0, increment back (undo) and reject — seat is gone
3. Mark seat HELD in Redis with TTL: SET seat:hold:{seatId} {userId} EX 300
4. Create a Booking row in Postgres with status=HELD and a generated idempotencyKey
5. Release the RLock (booking is now provisionally held, not yet paid)
6. Return holdId + expiresAt to frontend — HoldCountdown component starts a 300s timer
7. On payment success (see Payment Flow) → Booking.status = CONFIRMED, Seat.status = SOLD (Postgres)
8. If TTL expires before payment → Redis key auto-deletes; a scheduled reconciliation job
   marks the Booking EXPIRED and returns the seat to AVAILABLE
```

### Code Example

```java
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final RedissonClient redissonClient;
    private final StringRedisTemplate redisTemplate;

    public HoldResult holdSeat(Long eventId, Long seatId, Long userId) {
        String lockKey = "lock:seat:%d:%d".formatted(eventId, seatId);
        RLock lock = redissonClient.getLock(lockKey);

        boolean acquired = false;
        try {
            acquired = lock.tryLock(2, 30, TimeUnit.SECONDS);
            if (!acquired) {
                throw new SeatUnavailableException("Seat is currently being processed by another user");
            }

            String counterKey = "inventory:event:%d".formatted(eventId);
            Long remaining = redisTemplate.opsForValue().decrement(counterKey);

            if (remaining == null || remaining < 0) {
                redisTemplate.opsForValue().increment(counterKey); // undo
                throw new SeatUnavailableException("Seat no longer available");
            }

            String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
            redisTemplate.opsForValue().set(holdKey, userId.toString(), Duration.ofSeconds(300));

            return new HoldResult(holdKey, Instant.now().plusSeconds(300));

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SeatUnavailableException("Could not acquire seat lock");
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
```

---

## 8. Waitlist Logic (`service/WaitlistService.java`)

### Algorithm (Redis ZSET, FIFO by join time)

```
1. When a user joins the waitlist: ZADD waitlist:{eventId} {timestamp} {userId}
2. When a held seat expires or a booking is cancelled:
   - ZPOPMIN waitlist:{eventId} → earliest-joined user, removed atomically
   - Grant them a short-lived priority hold window (e.g. 2 minutes) to complete booking
3. Position lookup for UI: ZRANK waitlist:{eventId} {userId} → "You're #4 in line"
4. If user cancels their waitlist spot: ZREM waitlist:{eventId} {userId}
```

```java
public void joinWaitlist(Long eventId, Long userId) {
    redissonClient.getScoredSortedSet("waitlist:" + eventId)
        .add(Instant.now().toEpochMilli(), userId.toString());
}

public Optional<String> promoteNext(Long eventId) {
    RScoredSortedSet<String> waitlist = redissonClient.getScoredSortedSet("waitlist:" + eventId);
    return Optional.ofNullable(waitlist.pollFirst());
}
```

---

## 9. Backend API Reference

### Auth Routes

#### `POST /api/auth/register`

**Request Body:**
```json
{
  "fullName": "Shivam Rathore",
  "email": "shivam@example.com",
  "password": "SecurePass123"
}
```

**Response 201:**
```json
{
  "jwt": "<signed JWT>",
  "user": {
    "id": 1,
    "fullName": "Shivam Rathore",
    "email": "shivam@example.com",
    "role": "USER"
  }
}
```

---

#### `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "shivam@example.com",
  "password": "SecurePass123"
}
```

**Response 200:** same shape as register.

---

#### `POST /api/auth/forgot-password`

**Request Body:**
```json
{ "email": "shivam@example.com" }
```

**Response 200:** sends a time-limited reset token via email (or logs it in dev mode) — always returns 200 regardless of whether the email exists, to avoid leaking account existence.

#### `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "<reset-token-from-email>",
  "newPassword": "NewSecurePass123"
}
```

**Response 200:** confirms password updated; token is single-use and expires after ~30 minutes.

---

### Event Routes

#### `GET /api/events?category=CONCERT&city=Indore&page=0`

**Response 200:**
```json
{
  "content": [
    {
      "id": 12,
      "name": "Arijit Singh Live",
      "venue": "Brilliant Convention Centre",
      "startTime": "2026-09-10T19:00:00Z",
      "priceFrom": 999,
      "status": "PUBLISHED"
    }
  ],
  "totalPages": 3,
  "totalElements": 27
}
```

#### `GET /api/events/{id}/seats`

**Response 200:**
```json
{
  "eventId": 12,
  "seats": [
    { "id": 501, "label": "A1", "price": 1500, "status": "AVAILABLE" },
    { "id": 502, "label": "A2", "price": 1500, "status": "HELD" },
    { "id": 503, "label": "A3", "price": 1500, "status": "SOLD" }
  ]
}
```

---

### Booking Routes

#### `POST /api/bookings/hold`

**Request Body:**
```json
{
  "eventId": 12,
  "seatIds": [501, 504]
}
```

**Response 200:**
```json
{
  "bookingId": 88,
  "idempotencyKey": "b7f1c2e4-...",
  "status": "HELD",
  "expiresAt": "2026-08-04T10:35:00Z"
}
```

**Response 409 (seat unavailable):**
```json
{
  "error": "SEAT_UNAVAILABLE",
  "message": "One or more selected seats are no longer available"
}
```

**Logic:**
1. Validate seat IDs belong to the event and are not already SOLD
2. For each seat, call `SeatLockService.holdSeat()` (Section 7)
3. Create `Booking` row with status `HELD`, generate `idempotencyKey`
4. Return hold details with expiry for the frontend countdown timer

---

### Payment Routes

#### `POST /api/payments/create-order`

**Request Body:**
```json
{ "bookingId": 88 }
```

**Response 200:**
```json
{
  "razorpayOrderId": "order_NqZ8x...",
  "amount": 300000,
  "currency": "INR",
  "keyId": "rzp_test_xxxxxxxxxxxx"
}
```

**Logic:** wrapped in `@CircuitBreaker` + `@Retry` (Resilience4j) around the Razorpay Orders API call; uses `booking.idempotencyKey` as Razorpay's `receipt` field.

---

#### `POST /api/payments/verify`

**Request Body:**
```json
{
  "razorpayOrderId": "order_NqZ8x...",
  "razorpayPaymentId": "pay_NqZ9y...",
  "razorpaySignature": "3f2504e0..."
}
```

**Response 200:**
```json
{
  "bookingId": 88,
  "status": "CONFIRMED",
  "message": "Payment verified, booking confirmed"
}
```

**Logic:**
1. Recompute HMAC SHA256 signature server-side using `key_secret` and compare against `razorpaySignature`
2. If valid: `Booking.status = CONFIRMED`, `Seat.status = SOLD` (persisted to Postgres), Redis hold key deleted
3. If invalid: reject, log potential tampering attempt

---

#### `POST /api/payments/webhook`

Razorpay calls this server-to-server on `payment.captured` / `payment.failed` — treated as the source of truth in case the client-side callback is lost. Validates Razorpay's webhook signature header before processing.

---

### Waitlist Routes

#### `POST /api/waitlist/{eventId}/join`
#### `GET /api/waitlist/{eventId}/position`

**Response 200:**
```json
{ "position": 4, "estimatedWaitMinutes": 12 }
```

---

### Organizer Routes

#### `POST /api/organizer/events` — create event + seat map
#### `GET /api/organizer/events/{id}/sales` — sales overview

### Admin Routes

#### `GET /api/admin/rate-limit-events` — recent Resilience4j rate-limiter rejections, for the fraud dashboard

---

## 10. Frontend Data Fetching (React Query Hooks)

```js
// hooks/useEvents.js
export const useEvents = (filters) =>
  useQuery({
    queryKey: ['events', filters],
    queryFn: () => api.get('/events', { params: filters }).then(r => r.data)
  })

// hooks/useEvent.js
export const useEventSeats = (eventId) =>
  useQuery({
    queryKey: ['event', eventId, 'seats'],
    queryFn: () => api.get(`/events/${eventId}/seats`).then(r => r.data),
    refetchInterval: 5000   // poll for live seat status during active browsing
  })

// hooks/useHoldSeat.js
export const useHoldSeat = () =>
  useMutation({
    mutationFn: (payload) => api.post('/bookings/hold', payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries(['event'])
  })

// hooks/useBookings.js
export const useMyBookings = () =>
  useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => api.get('/bookings/my').then(r => r.data)
  })
```

### Triggering Razorpay Checkout (frontend)

```js
const handlePayment = async (bookingId) => {
  const { razorpayOrderId, amount, currency, keyId } =
    await api.post('/payments/create-order', { bookingId }).then(r => r.data)

  const options = {
    key: keyId,
    amount,
    currency,
    order_id: razorpayOrderId,
    handler: async (response) => {
      await api.post('/payments/verify', {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      })
      navigate('/confirmation')
    }
  }

  const rzp = new window.Razorpay(options)
  rzp.open()
}
```

---

## 11. End-to-End Flow Example: Booking Under Contention

```
1. User logs in → JWT stored
2. User opens EventDetail → SeatSelection page, polls GET /events/12/seats every 5s
3. User selects seats A1, A4 → clicks "Reserve"
4. Frontend calls POST /bookings/hold { eventId: 12, seatIds: [501, 504] }
5. Backend: for each seat, SeatLockService acquires Redisson RLock,
   DECRs the Redis inventory counter, sets a 300s TTL hold key
6. If another user was mid-request for the SAME seat at the same instant,
   their tryLock() call fails fast → they get a 409 SEAT_UNAVAILABLE response
   → frontend shows "Sorry, that seat was just taken" and refreshes the seat map
7. Booking row created in Postgres with status=HELD, HoldCountdown starts (300s)
8. User proceeds to Payment page → POST /payments/create-order → Razorpay Checkout opens
9. User pays with test card 4111 1111 1111 1111
10. Razorpay callback → POST /payments/verify → backend recomputes HMAC signature
11. Signature valid → Booking.status=CONFIRMED, Seat.status=SOLD (Postgres),
    Redis hold key deleted, inventory counter stays decremented (permanent)
12. User redirected to Confirmation page
13. [Alternate path] If the user abandons checkout, the 300s TTL expires,
    Redis auto-deletes the hold key, a reconciliation job marks Booking=EXPIRED
    and returns the seat to AVAILABLE — no manual cleanup needed
```

---

## 12. Key Implementation Details

### Idempotency Key Enforcement

```java
@PostMapping("/create-order")
public ResponseEntity<PaymentResponse> createOrder(@RequestBody CreateOrderRequest req) {
    Booking booking = bookingService.getById(req.getBookingId());

    // Reuse existing order if this booking already has one (prevents duplicate orders on retry)
    if (booking.getPayment() != null) {
        return ResponseEntity.ok(PaymentResponse.from(booking.getPayment()));
    }

    Order order = razorpayClient.orders.create(Map.of(
        "amount", booking.getTotalAmount().multiply(BigDecimal.valueOf(100)).intValue(),
        "currency", "INR",
        "receipt", booking.getIdempotencyKey()
    ));

    paymentService.savePendingPayment(booking, order);
    return ResponseEntity.ok(PaymentResponse.from(order));
}
```

### Signature Verification (server-side, never trust client alone)

```java
public boolean verifySignature(String orderId, String paymentId, String signature) {
    String payload = orderId + "|" + paymentId;
    String expectedSignature = hmacSha256(payload, razorpayKeySecret);
    return MessageDigest.isEqual(
        expectedSignature.getBytes(StandardCharsets.UTF_8),
        signature.getBytes(StandardCharsets.UTF_8)
    ); // constant-time comparison, avoids timing attacks
}
```

### Resilience4j Around the Payment Call

```java
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
@Retry(name = "paymentService")
@Bulkhead(name = "paymentService")
public Order createRazorpayOrder(BigDecimal amount, String receipt) {
    return razorpayClient.orders.create(buildOrderParams(amount, receipt));
}

public Order paymentFallback(BigDecimal amount, String receipt, Throwable t) {
    throw new PaymentServiceUnavailableException("Payment gateway is temporarily unavailable, please try again shortly");
}
```

### Reconciliation Job for Expired Holds

```java
@Scheduled(fixedRate = 60000) // every 60s
public void reconcileExpiredHolds() {
    List<Booking> staleHolds = bookingRepository
        .findByStatusAndCreatedAtBefore(BookingStatus.HELD, Instant.now().minusSeconds(300));

    for (Booking booking : staleHolds) {
        booking.setStatus(BookingStatus.EXPIRED);
        booking.getSeats().forEach(seat -> seat.setStatus(SeatStatus.AVAILABLE));
        bookingRepository.save(booking);
        waitlistService.promoteNext(booking.getEvent().getId());
    }
}
```

---

## 13. Suggested 21-Day Build Plan (~3 hrs/day)

| Day | Focus |
|---|---|
| 1-2 | Race conditions + Java multithreading fundamentals (conceptual, no coding) |
| 3-4 | Project setup: Spring Boot init, PostgreSQL connection, entity classes, `application.properties` |
| 5-6 | Redis fundamentals hands-on: SETNX, TTL, DECR, ZSET via redis-cli |
| 7-8 | Redisson integration: `RedisConfig`, `SeatLockService` with RLock + DECR + TTL hold |
| 9 | Concurrency proof: script that fires concurrent hold requests, confirm zero overselling |
| 10-11 | Resilience4j config (`Resilience4jConfig`) + wrap payment service calls |
| 12-13 | Razorpay integration: order creation, Checkout.js, signature verification, webhook |
| 14 | Testcontainers integration test for the seat-lock race condition |
| 15 | Waitlist service (ZSET) + reconciliation scheduled job |
| 16-17 | React setup: Vite, Tailwind, shadcn init, routing skeleton, AuthContext, Axios instance |
| 18 | SeatMap component + HoldCountdown + BookingSummary + Razorpay checkout wiring |
| 19 | MyBookings, WaitlistStatus, OrganizerDashboard, AdminDashboard pages |
| 20 | Docker Compose (Postgres + Redis + backend), GitHub Actions CI pipeline |
| 21 | k6 load test (1000 concurrent requests for 50 seats), capture results, write README |

---

## 14. Resume Talking Points

- Designed and implemented a distributed seat-locking system using Redisson `RLock`, Redis atomic counters (`DECR`), and TTL-based holds to prevent overselling under concurrent flash-sale traffic — proven with a k6 load test simulating 1000+ concurrent requests against limited inventory.
- Built a self-cleaning reservation system where abandoned holds automatically expire via Redis TTL, eliminating the need for cron-based cleanup jobs.
- Integrated Razorpay payment gateway with server-side HMAC signature verification, idempotency keys to prevent duplicate charges on retry, and webhook handling as the source of truth for payment status.
- Applied Resilience4j fault-tolerance patterns (Circuit Breaker, Retry, Bulkhead, Rate Limiter) around the payment path, each mapped to a specific failure mode, to contain gateway outages without degrading unrelated system functionality.
- Implemented a FIFO waitlist using a Redis sorted set (ZSET), with atomic promotion of the earliest-joined user when inventory frees up.
- Built a role-based (User/Organizer/Admin) React frontend with a live seat map, real-time hold countdown, and React Query-driven server state.
