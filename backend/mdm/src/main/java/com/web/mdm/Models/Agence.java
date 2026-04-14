package com.web.mdm.Models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import java.util.ArrayList;

@Entity
public class Agence {
    @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;
    private String email;
    private String tel;
    private String fax;
    private String site; // Address (kept for backward compat)

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", unique = true)
    private Site siteRef;

    // --- ORM FIX: Agence has Many Villes ---
    @OneToMany(mappedBy = "agence", fetch = FetchType.EAGER) // Eager to load city names for table
    private List<Ville> villes = new ArrayList<>();

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chef_agence_user_id")
    private Users chefAgence;

    // --- INVENTORY LINKS ---
    @OneToMany(mappedBy = "agence")
    @JsonIgnore
    private List<Users> users;
    @OneToMany(mappedBy = "agence")
    @JsonIgnore
    private List<Mobile> mobiles;
    @OneToMany(mappedBy = "agence")
    @JsonIgnore
    private List<CarteSim> carteSims;
    @OneToMany(mappedBy = "agence")
    @JsonIgnore
    private List<LigneInternet> lignesInternet;

    // Getters & Setters
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

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public String getFax() {
        return fax;
    }

    public void setFax(String fax) {
        this.fax = fax;
    }

    public Site getSiteRef() {
        return siteRef;
    }

    public void setSiteRef(Site siteRef) {
        this.siteRef = siteRef;
    }

    // Updated Getter for Villes
    public List<Ville> getVilles() {
        return villes;
    }

    public void setVilles(List<Ville> villes) {
        this.villes = villes;
    }

    public Users getChefAgence() {
        return chefAgence;
    }

    public void setChefAgence(Users chefAgence) {
        this.chefAgence = chefAgence;
    }

    public List<Users> getUsers() {
        return users;
    }

    public void setUsers(List<Users> users) {
        this.users = users;
    }
}