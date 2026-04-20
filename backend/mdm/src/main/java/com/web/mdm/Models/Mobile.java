package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Mobile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String sn; // Serial Number

    private String imei; // <--- NEW: Added for Frontend

    private String nom;
    private String marque;
    private String model;

    @Enumerated(EnumType.STRING)
    private MobileType type; // GSM, PDA, TSP

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private StatusAffectation statusAffectation; // <--- NEW: Lifecycle state

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Departement departement;

    private LocalDateTime dateEnvoie; // Assigned Date
    private LocalDateTime dateRecu; // Creation/Stock Date
    private LocalDateTime dateAnnuler;

    // <--- NEW: To track when it was added to MDM
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "materiel")
    @JsonIgnore
    private List<HistoriqueMobile> historique;

    public enum MobileType {
        TSP, GSM, PDA
    }

    public enum Status {
        active, inactive
    }

    public enum StatusAffectation {
        non_affecter, en_attente, recu, annuler, affecter
    }

    // --- GETTERS & SETTERS ---
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getSn() {
        return sn;
    }

    public void setSn(String sn) {
        this.sn = sn;
    }

    public String getImei() {
        return imei;
    }

    public void setImei(String imei) {
        this.imei = imei;
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

    public MobileType getType() {
        return type;
    }

    public void setType(MobileType type) {
        this.type = type;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public StatusAffectation getStatusAffectation() {
        return statusAffectation;
    }

    public void setStatusAffectation(StatusAffectation statusAffectation) {
        this.statusAffectation = statusAffectation;
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

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public Departement getDepartement() {
        return departement;
    }

    public void setDepartement(Departement departement) {
        this.departement = departement;
    }

    public LocalDateTime getDateEnvoie() {
        return dateEnvoie;
    }

    public void setDateEnvoie(LocalDateTime dateEnvoie) {
        this.dateEnvoie = dateEnvoie;
    }

    public LocalDateTime getDateRecu() {
        return dateRecu;
    }

    public void setDateRecu(LocalDateTime dateRecu) {
        this.dateRecu = dateRecu;
    }

    public LocalDateTime getDateAnnuler() {
        return dateAnnuler;
    }

    public void setDateAnnuler(LocalDateTime dateAnnuler) {
        this.dateAnnuler = dateAnnuler;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public List<HistoriqueMobile> getHistorique() {
        return historique;
    }

    public void setHistorique(List<HistoriqueMobile> historique) {
        this.historique = historique;
    }
}