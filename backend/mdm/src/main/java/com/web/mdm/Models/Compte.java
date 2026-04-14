package com.web.mdm.Models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
public class Compte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String login;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private CompteStatus status;

    // --- NEW: Role is now here, not in Profile ---
    @Column(name = "compte_type")
    @Enumerated(EnumType.STRING)
    private CompteType compteType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Users user;

    @Transient
    private Integer userId;

    public enum CompteStatus {
        active, desactiver
    }

    public enum CompteType {
        Agent,
        Manager,
        Administrateur,
        HR
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public CompteStatus getStatus() {
        return status;
    }

    public void setStatus(CompteStatus status) {
        this.status = status;
    }

    public CompteType getCompteType() {
        return compteType;
    }

    public void setCompteType(CompteType compteType) {
        this.compteType = compteType;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Integer getUserId() {
        return userId != null ? userId : (user != null ? user.getId() : null);
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }
}
