package com.web.mdm;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.springframework.http.HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD;
import static org.springframework.http.HttpHeaders.ORIGIN;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AuthCorsTest {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Test
    void loginPreflightAllowsFrontendOrigin() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        request.addHeader(ORIGIN, "http://localhost:3000");
        request.addHeader(ACCESS_CONTROL_REQUEST_METHOD, "POST");

        CorsConfiguration configuration = corsConfigurationSource.getCorsConfiguration(request);

        assertNotNull(configuration);
        assertTrue(configuration.checkOrigin("http://localhost:3000") != null);
        assertTrue(configuration.getAllowedMethods().contains("POST"));
    }
}
