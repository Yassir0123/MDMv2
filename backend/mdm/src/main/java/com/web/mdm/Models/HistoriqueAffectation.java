package com.web.mdm.Models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class HistoriqueAffectation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;

    private String userNom;
    private String userPrenom;
    private String userAddress;
    private String userTel;
    private String userCin;
    private String userMatricule;
    private String userStatus;
    private String userFonction;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Departement departement;

    private String departmentNom;
    private Integer departmentEffective;

    @ManyToOne
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    private String entrepotNom;

    private String agenceNom;
    private String agenceSite;
    private String agenceEmail;
    private String agenceTel;
    private String agenceVille;

    private String statusEvent;
    private String fonction;
    private LocalDate dateEvent;
    private String motif;

    @Column(name = "chef_departement_id")
    private Integer chefDepartementId;

    @Column(name = "chef_agence_id")
    private Integer chefAgenceId;

    @Column(name = "chef_entrepot_id")
    private Integer chefEntrepotId;

    @Column(name = "manager_id")
    private Integer managerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "comptes", "departement", "agence", "entrepot",
            "profile", "fonctionRef" })
    private Users manager;

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public String getUserNom() {
        return userNom;
    }

    public void setUserNom(String userNom) {
        this.userNom = userNom;
    }

    public String getUserPrenom() {
        return userPrenom;
    }

    public void setUserPrenom(String userPrenom) {
        this.userPrenom = userPrenom;
    }

    public String getUserAddress() {
        return userAddress;
    }

    public void setUserAddress(String userAddress) {
        this.userAddress = userAddress;
    }

    public String getUserTel() {
        return userTel;
    }

    public void setUserTel(String userTel) {
        this.userTel = userTel;
    }

    public String getUserCin() {
        return userCin;
    }

    public void setUserCin(String userCin) {
        this.userCin = userCin;
    }

    public String getUserMatricule() {
        return userMatricule;
    }

    public void setUserMatricule(String userMatricule) {
        this.userMatricule = userMatricule;
    }

    public String getUserStatus() {
        return userStatus;
    }

    public void setUserStatus(String userStatus) {
        this.userStatus = userStatus;
    }

    public String getUserFonction() {
        return userFonction;
    }

    public void setUserFonction(String userFonction) {
        this.userFonction = userFonction;
    }

    public Departement getDepartement() {
        return departement;
    }

    public void setDepartement(Departement departement) {
        this.departement = departement;
    }

    public String getDepartmentNom() {
        return departmentNom;
    }

    public void setDepartmentNom(String departmentNom) {
        this.departmentNom = departmentNom;
    }

    public Integer getDepartmentEffective() {
        return departmentEffective;
    }

    public void setDepartmentEffective(Integer departmentEffective) {
        this.departmentEffective = departmentEffective;
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

    public String getEntrepotNom() {
        return entrepotNom;
    }

    public void setEntrepotNom(String entrepotNom) {
        this.entrepotNom = entrepotNom;
    }

    public String getAgenceNom() {
        return agenceNom;
    }

    public void setAgenceNom(String agenceNom) {
        this.agenceNom = agenceNom;
    }

    public String getAgenceSite() {
        return agenceSite;
    }

    public void setAgenceSite(String agenceSite) {
        this.agenceSite = agenceSite;
    }

    public String getAgenceEmail() {
        return agenceEmail;
    }

    public void setAgenceEmail(String agenceEmail) {
        this.agenceEmail = agenceEmail;
    }

    public String getAgenceTel() {
        return agenceTel;
    }

    public void setAgenceTel(String agenceTel) {
        this.agenceTel = agenceTel;
    }

    public String getAgenceVille() {
        return agenceVille;
    }

    public void setAgenceVille(String agenceVille) {
        this.agenceVille = agenceVille;
    }

    public String getStatusEvent() {
        return statusEvent;
    }

    public void setStatusEvent(String statusEvent) {
        this.statusEvent = statusEvent;
    }

    public String getFonction() {
        return fonction;
    }

    public void setFonction(String fonction) {
        this.fonction = fonction;
    }

    public LocalDate getDateEvent() {
        return dateEvent;
    }

    public void setDateEvent(LocalDate dateEvent) {
        this.dateEvent = dateEvent;
    }

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }

    public Integer getChefDepartementId() {
        return chefDepartementId;
    }

    public void setChefDepartementId(Integer chefDepartementId) {
        this.chefDepartementId = chefDepartementId;
    }

    public Integer getChefAgenceId() {
        return chefAgenceId;
    }

    public void setChefAgenceId(Integer chefAgenceId) {
        this.chefAgenceId = chefAgenceId;
    }

    public Integer getChefEntrepotId() {
        return chefEntrepotId;
    }

    public void setChefEntrepotId(Integer chefEntrepotId) {
        this.chefEntrepotId = chefEntrepotId;
    }

    public Integer getManagerId() {
        return managerId;
    }

    public void setManagerId(Integer managerId) {
        this.managerId = managerId;
    }

    public Users getManager() {
        return manager;
    }

    public void setManager(Users manager) {
        this.manager = manager;
    }
}
