package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class HistoriqueMateriel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer materielId; // Link to specific ID
    private String typeMateriel;

    private String sn;
    private String numero;
    private String operateur;
    private String materielName;

    // User Snapshots
    @ManyToOne
    @JoinColumn(name = "affected_user_id")
    private Users affectedUser;
    private String userCin;
    private String userMatricule;
    private String userNom;
    private String userPrenom;
    private String userStatus;
    private String userFonction;

    @ManyToOne
    @JoinColumn(name = "departement_id")
    private Departement departement;

    @ManyToOne
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    // For display convenience
    private String agenceNom;
    private String entrepotNom;
    private String departementNom;

    private String statusEvent;

    private LocalDate dateEvent;
    private LocalDate dateRecu;
    private LocalDate dateEnvoie;
    private LocalDate dateAnnuler;

    // Getters & Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getMaterielId() {
        return materielId;
    }

    public void setMaterielId(Integer materielId) {
        this.materielId = materielId;
    }

    public String getTypeMateriel() {
        return typeMateriel;
    }

    public void setTypeMateriel(String typeMateriel) {
        this.typeMateriel = typeMateriel;
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

    public String getMaterielName() {
        return materielName;
    }

    public void setMaterielName(String materielName) {
        this.materielName = materielName;
    }

    public Users getAffectedUser() {
        return affectedUser;
    }

    public void setAffectedUser(Users affectedUser) {
        this.affectedUser = affectedUser;
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

    public LocalDate getDateAnnuler() {
        return dateAnnuler;
    }

    public void setDateAnnuler(LocalDate dateAnnuler) {
        this.dateAnnuler = dateAnnuler;
    }
}