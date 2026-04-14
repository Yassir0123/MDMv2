package com.web.mdm.Models;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore; // Import needed for the fix below

@Entity
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AdminType adminType;

    @OneToMany(mappedBy = "profile")
    @JsonIgnore // Prevent infinite loops in JSON
    private List<Users> users;

    // FIX: Changed to Title Case to match your Database values ("Agent", "Manager")
    public enum AdminType {
        Agent,
        Manager,
        Administrateur
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public AdminType getAdminType() { return adminType; }
    public void setAdminType(AdminType adminType) { this.adminType = adminType; }
    public List<Users> getUsers() { return users; }
    public void setUsers(List<Users> users) { this.users = users; }
}