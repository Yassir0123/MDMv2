package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
public class HistoriqueCartesim implements AdminTrackedHistory, ManagerTrackedHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "materiel_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @NotFound(action = NotFoundAction.IGNORE)
    private CarteSim materiel;

    @Column(length = 100)
    private String sn;

    private String numero;
    private String operateur;
    private String pin;
    private String pin2;
    private String puk;
    private String puk2;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;

    @Column(name = "admin_id")
    private Integer adminId;

    @Column(name = "manager_id")
    private Integer managerId;

    // User Snapshot
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
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne
    @JoinColumn(name = "departement_id")
    private Departement departement;

    private String agenceNom;
    private String entrepotNom;
    private String departementNom;

    private String chefAgenceNom;

    // *** FIX: Add this field to store the ID ***
    @Column(name = "chef_agence_user_id")
    private Integer chefAgenceId;

    private String statusEvent;
    private LocalDateTime dateEvent;
    private LocalDateTime dateAnnuler;
    private LocalDateTime dateRecu;
    private LocalDateTime dateEnvoie;

    private String motif;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    // Getters & Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public CarteSim getMateriel() {
        return materiel;
    }

    public void setMateriel(CarteSim materiel) {
        this.materiel = materiel;
    }

    public String getSn() {
        return sn;
    }

    public void setSn(String sn) {
        this.sn = sn;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getOperateur() {
        return operateur;
    }

    public void setOperateur(String operateur) {
        this.operateur = operateur;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public String getPin2() {
        return pin2;
    }

    public void setPin2(String pin2) {
        this.pin2 = pin2;
    }

    public String getPuk() {
        return puk;
    }

    public void setPuk(String puk) {
        this.puk = puk;
    }

    public String getPuk2() {
        return puk2;
    }

    public void setPuk2(String puk2) {
        this.puk2 = puk2;
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

    public Entrepot getEntrepot() {
        return entrepot;
    }

    public void setEntrepot(Entrepot entrepot) {
        this.entrepot = entrepot;
    }

    public Departement getDepartement() {
        return departement;
    }

    public void setDepartement(Departement departement) {
        this.departement = departement;
    }

    public String getAgenceNom() {
        return agenceNom;
    }

    public void setAgenceNom(String agenceNom) {
        this.agenceNom = agenceNom;
    }

    public String getEntrepotNom() {
        return entrepotNom;
    }

    public void setEntrepotNom(String entrepotNom) {
        this.entrepotNom = entrepotNom;
    }

    public String getDepartementNom() {
        return departementNom;
    }

    public void setDepartementNom(String departementNom) {
        this.departementNom = departementNom;
    }

    public String getChefAgenceNom() {
        return chefAgenceNom;
    }

    public void setChefAgenceNom(String chefAgenceNom) {
        this.chefAgenceNom = chefAgenceNom;
    }

    // *** FIX: New Getter/Setter ***
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

    public LocalDateTime getDateEvent() {
        return dateEvent;
    }

    public void setDateEvent(LocalDateTime dateEvent) {
        this.dateEvent = dateEvent;
    }

    public LocalDateTime getDateAnnuler() {
        return dateAnnuler;
    }

    public void setDateAnnuler(LocalDateTime dateAnnuler) {
        this.dateAnnuler = dateAnnuler;
    }

    public LocalDateTime getDateRecu() {
        return dateRecu;
    }

    public void setDateRecu(LocalDateTime dateRecu) {
        this.dateRecu = dateRecu;
    }

    public LocalDateTime getDateEnvoie() {
        return dateEnvoie;
    }

    public void setDateEnvoie(LocalDateTime dateEnvoie) {
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
