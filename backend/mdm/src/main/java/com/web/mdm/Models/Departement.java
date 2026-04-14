package com.web.mdm.Models;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
//import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
public class Departement {
    @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;
    private Integer effective;

    @OneToOne
    @JoinColumn(name = "chef_department_user_id")
    private Users chefDepartment;

    @OneToMany(mappedBy = "departement")
    @JsonIgnore
    private List<Users> users;

    @OneToMany(mappedBy = "departement")
    @JsonIgnore
    private List<Mobile> mobiles;

    // --- FIX: ADD @JsonIgnore HERE ---
    @OneToMany(mappedBy = "departement")
    @JsonIgnore
    private List<LigneInternet> lignesInternet;

    @OneToMany(mappedBy = "departement")
    @JsonIgnore
    private List<HistoriqueAffectation> historiqueAffectations;

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public Integer getEffective() {
        return effective;
    }

    public void setEffective(Integer effective) {
        this.effective = effective;
    }

    public Users getChefDepartment() {
        return chefDepartment;
    }

    public void setChefDepartment(Users chefDepartment) {
        this.chefDepartment = chefDepartment;
    }

    public List<Users> getUsers() {
        return users;
    }

    public void setUsers(List<Users> users) {
        this.users = users;
    }

    public List<Mobile> getMobiles() {
        return mobiles;
    }

    public void setMobiles(List<Mobile> mobiles) {
        this.mobiles = mobiles;
    }

    public List<LigneInternet> getLignesInternet() {
        return lignesInternet;
    }

    public void setLignesInternet(List<LigneInternet> lignesInternet) {
        this.lignesInternet = lignesInternet;
    }

    public List<HistoriqueAffectation> getHistoriqueAffectations() {
        return historiqueAffectations;
    }

    public void setHistoriqueAffectations(List<HistoriqueAffectation> historiqueAffectations) {
        this.historiqueAffectations = historiqueAffectations;
    }
}