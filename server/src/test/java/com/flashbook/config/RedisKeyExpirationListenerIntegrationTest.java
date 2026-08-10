package com.flashbook.config;

import redis.embedded.RedisServer;
import com.flashbook.entity.*;
import com.flashbook.repository.*;
import com.flashbook.service.SeatLockService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "JWT_SECRET=9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e"
})
public class RedisKeyExpirationListenerIntegrationTest {

    private static RedisServer redisServer;

    @BeforeAll
    static void startRedis() throws Exception {
        redisServer = new RedisServer(6380);
        redisServer.start();
    }

    @DynamicPropertySource
    static void redisProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.redis.port", () -> 6380);
        registry.add("spring.redis.host", () -> "127.0.0.1");
    }

    @AfterAll
    static void stopRedis() {
        if (redisServer != null) {
            redisServer.stop();
        }
    }

    @Autowired
    private SeatLockService seatLockService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private VenueRepository venueRepository;

    private Event event;
    private Seat seat;
    private User user;

    @BeforeEach
    void setUp() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();

        Venue venue = Venue.builder()
                .name("Test Venue")
                .city("Test City")
                .address("123 Test St")
                .totalCapacity(100)
                .build();
        venue = venueRepository.save(venue);

        user = User.builder()
                .fullName("Test User")
                .email("test-listener@example.com")
                .password("password123")
                .role(Role.USER)
                .build();
        user = userRepository.save(user);

        event = Event.builder()
                .name("Test Event")
                .description("Test Description")
                .venue(venue)
                .organizer(user)
                .startTime(Instant.now().plusSeconds(3600))
                .status(EventStatus.PUBLISHED)
                .build();
        event = eventRepository.save(event);

        seat = Seat.builder()
                .event(event)
                .seatLabel("A1")
                .price(BigDecimal.valueOf(100.00))
                .status(SeatStatus.AVAILABLE)
                .build();
        seat = seatRepository.save(seat);
    }

    @Test
    void whenHoldKeyExpires_inventoryIsRestoredExactlyOnce() {
        Long eventId = event.getId();
        Long seatId = seat.getId();

        // 1. Initialize Redis inventory to 1
        String counterKey = "inventory:event:" + eventId;
        redisTemplate.opsForValue().set(counterKey, "1");

        // 2. Perform hold
        seatLockService.holdSeat(eventId, seatId, user.getId());

        // Assert inventory was decremented to 0
        assertEquals("0", redisTemplate.opsForValue().get(counterKey));

        // Assert hold key exists in Redis
        String holdKey = "hold:seat:%d:%d".formatted(eventId, seatId);
        assertTrue(Boolean.TRUE.equals(redisTemplate.hasKey(holdKey)));

        // 3. Wait for TTL to expire and assert inventory is restored back to 1
        redisTemplate.expire(holdKey, 1, TimeUnit.SECONDS);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            assertFalse(Boolean.TRUE.equals(redisTemplate.hasKey(holdKey)));
            assertEquals("1", redisTemplate.opsForValue().get(counterKey));
        });

        // 4. Assert that counter stays at 1 (idempotency marker prevents double increments)
        assertEquals("1", redisTemplate.opsForValue().get(counterKey));
    }
}
