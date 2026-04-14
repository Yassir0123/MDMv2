package com.web.mdm.Models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fonction")
public class Fonction {
    @Id
    @Column(name = "id", columnDefinition = "varchar(255)")
    private String id;

    private String nom;

    @OneToMany(mappedBy = "fonctionRef")
    @JsonIgnore
    private List<Users> users = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public List<Users> getUsers() {
        return users;
    }

    public void setUsers(List<Users> users) {
        this.users = users;
    }
}
