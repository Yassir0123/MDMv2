package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDate;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
public class HistoriqueMobile implements AdminTrackedHistory, ManagerTrackedHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "materiel_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @NotFound(action = NotFoundAction.IGNORE)
    private Mobile materiel;

    @Column(length = 100)
    private String sn;

    private String nom;
    private String marque;
    private String model;
    private String type;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;

    @Column(name = "admin_id")
    private Integer adminId;

    @Column(name = "manager_id")
    private Integer managerId;

    private String userNom;
    private String userPrenom;
    private String userAddress;
    private String userTel;
    private String userCin;
    private String userMatricule;
    private String userStatus;
    private String userFonction;

    // --- Context Snapshots ---
    @ManyToOne
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Departement departement;

    @ManyToOne
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    private String agenceNom;
    private String departmentNom;
    private Integer departmentEffective;
    private String entrepotNom;

    private String chefAgenceNom;

    @Column(name = "chef_agence_user_id")
    private Integer chefAgenceId;

    private String statusEvent;
    private LocalDate dateEvent;
    private LocalDate dateAnnuler;
    private LocalDate dateRecu;
    private LocalDate dateEnvoie;

    private String motif;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Mobile getMateriel() {
        return materiel;
    }

    public void setMateriel(Mobile materiel) {
        this.materiel = materiel;
    }

    public String getSn() {
        return sn;
    }

    public void setSn(String sn) {
        this.sn = sn;
    }

    // Keep backward compat alias
    public String getSN() {
        return sn;
    }

    public void setSN(String SN) {
        this.sn = SN;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getMarque() {
        return marque;
    }

    public void setMarque(String marque) {
        this.marque = marque;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Integer getAdminId() {
        return adminId;
    }

    public void setAdminId(Integer adminId) {
        this.adminId = adminId;
    }

    public Integer getManagerId() {
        return managerId;
    }

    public void setManagerId(Integer managerId) {
        this.managerId = managerId;
    }

    @Override
    public Integer resolveTargetUserId() {
        return user != null ? user.getId() : null;
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

    public Agence getAgence() {
        return agence;
    }

    public void setAgence(Agence agence) {
        this.agence = agence;
    }

    public Departement getDepartement() {
        return departement;
    }

    public void setDepartement(Departement departement) {
        this.departement = departement;
    }

    public Entrepot getEntrepot() {
        return entrepot;
    }

    public void setEntrepot(Entrepot entrepot) {
        this.entrepot = entrepot;
    }

    public String getAgenceNom() {
        return agenceNom;
    }

    public void setAgenceNom(String agenceNom) {
        this.agenceNom = agenceNom;
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

    public String getEntrepotNom() {
        return entrepotNom;
    }

    public void setEntrepotNom(String entrepotNom) {
        this.entrepotNom = entrepotNom;
    }

    public String getChefAgenceNom() {
        return chefAgenceNom;
    }

    public void setChefAgenceNom(String chefAgenceNom) {
        this.chefAgenceNom = chefAgenceNom;
    }

    public Integer getChefAgenceId() {
        return chefAgenceId;
    }

    public void setChefAgenceId(Integer chefAgenceId) {
        this.chefAgenceId = chefAgenceId;
    }

    public String getStatusEvent() {
        return statusEvent;
    }

    public void setStatusEvent(String statusEvent) {
        this.statusEvent = statusEvent;
    }

    public LocalDate getDateEvent() {
        return dateEvent;
    }

    public void setDateEvent(LocalDate dateEvent) {
        this.dateEvent = dateEvent;
    }

    public LocalDate getDateAnnuler() {
        return dateAnnuler;
    }

    public void setDateAnnuler(LocalDate dateAnnuler) {
        this.dateAnnuler = dateAnnuler;
    }

    public LocalDate getDateRecu() {
        return dateRecu;
    }

    public void setDateRecu(LocalDate dateRecu) {
        this.dateRecu = dateRecu;
    }

    public LocalDate getDateEnvoie() {
        return dateEnvoie;
    }

    public void setDateEnvoie(LocalDate dateEnvoie) {
        this.dateEnvoie = dateEnvoie;
    }

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }
}
