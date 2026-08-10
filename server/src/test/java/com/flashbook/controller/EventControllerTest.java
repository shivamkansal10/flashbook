package com.flashbook.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flashbook.dto.event.EventRequest;
import com.flashbook.dto.event.EventResponse;
import com.flashbook.entity.EventCategory;
import com.flashbook.security.CustomUserDetailsService;
import com.flashbook.security.JwtUtil;
import com.flashbook.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EventController.class)
public class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EventService eventService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "organizer@example.com", roles = "ORGANIZER")
    void createEvent_WithValidIso8601StartTime_Succeeds() throws Exception {
        String jsonPayload = """
                {
                  "name": "Live Concert",
                  "description": "Epic music night",
                  "venueId": 1,
                  "startTime": "2030-08-08T20:00:00Z",
                  "category": "CONCERT",
                  "imageUrl": "http://example.com/image.png"
                }
                """;

        EventResponse mockResponse = EventResponse.builder()
                .id(1L)
                .name("Live Concert")
                .build();

        when(eventService.createEvent(any(EventRequest.class), eq("organizer@example.com")))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/organizer/events")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated());
    }
}
