package com.web.mdm.Security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // This logs the REAL reason Spring Security rejected the request
        logger.error("[AUTH DEBUG] Unauthorized request to '{}' — Reason: {} ({})",
                request.getServletPath(),
                authException.getMessage(),
                authException.getClass().getSimpleName());
        if (authException.getCause() != null) {
            logger.error("[AUTH DEBUG] Caused by: {}", authException.getCause().getMessage());
        }
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Unauthorized");
    }
}
