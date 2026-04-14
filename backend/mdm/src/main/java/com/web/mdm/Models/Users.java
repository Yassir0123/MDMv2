package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "Users")
public class Users {
    @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;
    private String prenom;
    private String address;
    private String tel;
    private String cin;
    private String email;
    private String matricule;

    private Integer managerId;

    @Column(name = "is_manager")
    private Integer isManager;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    private LocalDate dateDesactiver;
    @Column(name = "date_sortie")
    private LocalDate dateSortie;
    private LocalDate dateEmbauche;
    private LocalDate dateDetacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fonction_id", columnDefinition = "varchar(255)")
    private Fonction fonctionRef;

    @ManyToOne(fetch = FetchType.LAZY) // <--- ADD THIS
    @JoinColumn(name = "departement_id")
    private Departement departement;

    @ManyToOne(fetch = FetchType.LAZY) // <--- ADD THIS
    @JoinColumn(name = "agence_id")
    @JsonIgnoreProperties({ "chefAgence", "users" })
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne(fetch = FetchType.LAZY) // <--- ADD THIS
    @JoinColumn(name = "profile_id")
    private Profile profile;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Compte> comptes;

    @OneToOne(mappedBy = "user")
    @JsonIgnore
    private CarteSim carteSim;

    @OneToOne(mappedBy = "user")
    @JsonIgnore
    private Mobile mobile;

    // Enum for status
    public enum UserStatus {
        active, desactiver, detacher, archived
    }

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

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getTel() {
        return tel;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public String getCin() {
        return cin;
    }

    public void setCin(String cin) {
        this.cin = cin;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public LocalDate getDateDesactiver() {
        return dateDesactiver;
    }

    public void setDateDesactiver(LocalDate dateDesactiver) {
        this.dateDesactiver = dateDesactiver;
    }

    public LocalDate getDateEmbauche() {
        return dateEmbauche;
    }

    public void setDateEmbauche(LocalDate dateEmbauche) {
        this.dateEmbauche = dateEmbauche;
    }

    public LocalDate getDateSortie() {
        return dateSortie;
    }

    public void setDateSortie(LocalDate dateSortie) {
        this.dateSortie = dateSortie;
    }

    public LocalDate getDateDetacher() {
        return dateDetacher;
    }

    public void setDateDetacher(LocalDate dateDetacher) {
        this.dateDetacher = dateDetacher;
    }

    public Fonction getFonctionRef() {
        return fonctionRef;
    }

    public void setFonctionRef(Fonction fonctionRef) {
        this.fonctionRef = fonctionRef;
    }

    public Departement getDepartement() {
        return departement;
    }

    public void setDepartement(Departement departement) {
        this.departement = departement;
    }

    public Agence getAgence() {
        return agence;
    }

    public void setAgence(Agence agence) {
        this.agence = agence;
    }

    public Entrepot getEntrepot() {
        return entrepot;
    }

    public void setEntrepot(Entrepot entrepot) {
        this.entrepot = entrepot;
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public List<Compte> getComptes() {
        return comptes;
    }

    public void setComptes(List<Compte> comptes) {
        this.comptes = comptes;
    }

    public CarteSim getCarteSim() {
        return carteSim;
    }

    public void setCarteSim(CarteSim carteSim) {
        this.carteSim = carteSim;
    }

    public Mobile getMobile() {
        return mobile;
    }

    public void setMobile(Mobile mobile) {
        this.mobile = mobile;
    }

    public Integer getManagerId() {
        return managerId;
    }

    public void setManagerId(Integer managerId) {
        this.managerId = managerId;
    }

    public Integer getIsManager() {
        return isManager;
    }

    public void setIsManager(Integer isManager) {
        this.isManager = isManager;
    }
}
