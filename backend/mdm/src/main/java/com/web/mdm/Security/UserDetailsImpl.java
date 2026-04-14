package com.web.mdm.Security;

import com.web.mdm.Models.Compte;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Objects;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(UserDetailsImpl.class);

    private Integer id; // Compte ID
    private Integer userId; // Users table ID
    private String username;
    @JsonIgnore
    private String password;
    private String email;
    private String role;
    private String status;

    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Integer id, Integer userId, String username, String email, String password, String role, String status,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.status = status;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(Compte compte) {
        String roleName = (compte.getCompteType() != null)
                ? compte.getCompteType().name()
                : "Agent";

        String status = (compte.getStatus() != null)
                ? compte.getStatus().name()
                : "desactiver";

        // ===== DEBUG LOGGING — remove after fixing login issue =====
        logger.warn("[AUTH DEBUG] Login attempted for: '{}'", compte.getLogin());
        logger.warn("[AUTH DEBUG] Hashed password from DB: '{}'", compte.getPassword());
        logger.warn("[AUTH DEBUG] Status from DB (raw enum name): '{}'", status);
        logger.warn("[AUTH DEBUG] isEnabled will return: {}", status != null && status.equalsIgnoreCase("active"));
        // ===========================================================

        return new UserDetailsImpl(
                compte.getId(),
                compte.getUserId(),
                compte.getLogin(),
                compte.getLogin(),
                compte.getPassword(),
                roleName,
                status,
                Collections.singletonList(new SimpleGrantedAuthority(roleName)));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Case-insensitive so it matches "active", "Active", "ACTIVE", etc.
        return status != null && status.equalsIgnoreCase("active");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }
}