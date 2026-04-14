package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDate;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
public class HistoriqueLigneinternet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "materiel_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @NotFound(action = NotFoundAction.IGNORE)
    private LigneInternet materiel;

    @Column(length = 100)
    private String SN;

    private String nom;
    private String operateur;
    private String site;
    private String vitesse;

    private Integer userId;
    private String userNom;
    private String agenceNom;
    private String departementNom;
    private String entrepotNom;

    private Integer chefAgenceId;
    private String chefAgenceNom;

    @ManyToOne
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne
    @JoinColumn(name = "departement_id")
    private Departement departement;

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

    public LigneInternet getMateriel() {
        return materiel;
    }

    public void setMateriel(LigneInternet materiel) {
        this.materiel = materiel;
    }

    public String getSN() {
        return SN;
    }

    public void setSN(String SN) {
        this.SN = SN;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getOperateur() {
        return operateur;
    }

    public void setOperateur(String operateur) {
        this.operateur = operateur;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getVitesse() {
        return vitesse;
    }

    public void setVitesse(String vitesse) {
        this.vitesse = vitesse;
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

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUserNom() {
        return userNom;
    }

    public void setUserNom(String userNom) {
        this.userNom = userNom;
    }

    public String getAgenceNom() {
        return agenceNom;
    }

    public void setAgenceNom(String agenceNom) {
        this.agenceNom = agenceNom;
    }

    public String getDepartementNom() {
        return departementNom;
    }

    public void setDepartementNom(String departementNom) {
        this.departementNom = departementNom;
    }

    public String getEntrepotNom() {
        return entrepotNom;
    }

    public void setEntrepotNom(String entrepotNom) {
        this.entrepotNom = entrepotNom;
    }

    public Integer getChefAgenceId() {
        return chefAgenceId;
    }

    public void setChefAgenceId(Integer chefAgenceId) {
        this.chefAgenceId = chefAgenceId;
    }

    public String getChefAgenceNom() {
        return chefAgenceNom;
    }

    public void setChefAgenceNom(String chefAgenceNom) {
        this.chefAgenceNom = chefAgenceNom;
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
