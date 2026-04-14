package com.web.mdm.Dto;

//import java.util.List;

public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Integer id; // Compte ID
    private Integer userId; // Users table ID (from Compte.user_id)
    private String username;
    private String email;
    private String role;
    private String adminType;

    public JwtResponse(String accessToken, Integer id, Integer userId, String username, String email, String role,
            String adminType) {
        this.token = accessToken;
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.adminType = adminType;
    }

    // Getters
    public String getAccessToken() {
        return token;
    }

    public String getTokenType() {
        return type;
    }

    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getAdminType() {
        return adminType;
    }
}