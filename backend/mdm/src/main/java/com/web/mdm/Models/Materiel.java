package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Materiel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer specificId; // ID from specific table
    private String typeMateriel; // "Mobile", "CarteSim", "LigneInternet"

    private String sn;
    private String numero;
    private String operateur;
    private String materielName;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users affectedUser;

    @ManyToOne
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne
    @JoinColumn(name = "departement_id")
    private Departement departement;

    private String status;
    private String statusAffectation;

    private LocalDate dateRecu;
    private LocalDate dateAnnuler;
    private LocalDate dateEnvoie;
    private LocalDate dateCreation;

    // Getters & Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSpecificId() {
        return specificId;
    }

    public void setSpecificId(Integer specificId) {
        this.specificId = specificId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusAffectation() {
        return statusAffectation;
    }

    public void setStatusAffectation(String statusAffectation) {
        this.statusAffectation = statusAffectation;
    }

    public LocalDate getDateRecu() {
        return dateRecu;
    }

    public void setDateRecu(LocalDate dateRecu) {
        this.dateRecu = dateRecu;
    }

    public LocalDate getDateAnnuler() {
        return dateAnnuler;
    }

    public void setDateAnnuler(LocalDate dateAnnuler) {
        this.dateAnnuler = dateAnnuler;
    }

    public LocalDate getDateEnvoie() {
        return dateEnvoie;
    }

    public void setDateEnvoie(LocalDate dateEnvoie) {
        this.dateEnvoie = dateEnvoie;
    }

    public LocalDate getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDate dateCreation) {
        this.dateCreation = dateCreation;
    }
}