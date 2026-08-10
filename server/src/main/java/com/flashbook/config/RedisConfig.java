package com.flashbook.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

@Slf4j
@Configuration
public class RedisConfig {

    @Value("${spring.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.port:6379}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    @Value("${REDIS_SSL:false}")
    private boolean ssl;

    @Bean
    public CommandLineRunner enableKeyspaceNotifications(StringRedisTemplate redisTemplate) {
        return args -> {
            try {
                redisTemplate.getConnectionFactory().getConnection().setConfig("notify-keyspace-events", "Ex");
                log.info("Successfully enabled Redis keyspace notifications for expired events (notify-keyspace-events=Ex)");
            } catch (Exception e) {
                log.warn("Failed to set notify-keyspace-events config on Redis startup. Keyspace notifications may need manual configuration.", e);
            }
        };
    }

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();

        // Fallback to System.getenv() directly if Spring properties are not set or default
        boolean isSsl = ssl || "true".equalsIgnoreCase(System.getenv("REDIS_SSL"));
        
        String host = redisHost;
        if (host == null || host.equals("localhost")) {
            String envHost = System.getenv("REDIS_HOST");
            if (envHost != null && !envHost.trim().isEmpty()) {
                host = envHost.trim();
            }
        }

        int port = redisPort;
        if (port == 6379) {
            String envPort = System.getenv("REDIS_PORT");
            if (envPort != null && !envPort.trim().isEmpty()) {
                try {
                    port = Integer.parseInt(envPort.trim());
                } catch (NumberFormatException e) {
                    log.warn("Invalid REDIS_PORT value: {}, falling back to 6379", envPort);
                }
            }
        }

        String password = redisPassword;
        if (password == null || password.trim().isEmpty()) {
            String envPassword = System.getenv("REDIS_PASSWORD");
            if (envPassword != null && !envPassword.trim().isEmpty()) {
                password = envPassword;
            }
        }

        String protocol = isSsl ? "rediss://" : "redis://";
        String fullAddress = protocol + host + ":" + port;
        
        log.info("Configuring RedissonClient with address: {} (ssl: {})", fullAddress, isSsl);
        if (password != null && !password.trim().isEmpty()) {
            log.info("Using Redis password authentication (length: {})", password.trim().length());
        } else {
            log.warn("No Redis password authentication configured!");
        }

        var serverConfig = config.useSingleServer()
                .setAddress(fullAddress);

        if (password != null && !password.trim().isEmpty()) {
            serverConfig.setPassword(password.trim());
        }
        return Redisson.create(config);
    }

    @Bean
    public org.springframework.data.redis.listener.RedisMessageListenerContainer redisMessageListenerContainer(
            org.springframework.data.redis.connection.RedisConnectionFactory connectionFactory) {
        org.springframework.data.redis.listener.RedisMessageListenerContainer container =
                new org.springframework.data.redis.listener.RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        return container;
    }
}
