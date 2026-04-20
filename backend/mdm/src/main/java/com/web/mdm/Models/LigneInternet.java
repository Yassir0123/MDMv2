package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class LigneInternet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true)
    private String sn; // Treated as "Number/ID" in frontend

    private String nom;
    private String operateur; // Provider
    private String site; // Legacy field, now we use Agence relation
    private String vitesse; // Speed

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private StatusAffectation statusAffectation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private Agence agence; // Represents "Site d'installation"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id")
    private Departement departement; // Optional subdivision

    private LocalDateTime dateEnvoie; // Assignment Date
    private LocalDateTime dateRecu; // Creation Date (Legacy)
    private LocalDateTime dateAnnuler; // Resignation Date

    // <--- NEW: Added as requested
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "materiel")
    @JsonIgnore
    private List<HistoriqueLigneinternet> historique;

    // Updated Enum to match Frontend (Active, Inactive, Resigned)
    public enum Status {
        active, inactive, resilier
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

    public List<HistoriqueLigneinternet> getHistorique() {
        return historique;
    }

    public void setHistorique(List<HistoriqueLigneinternet> historique) {
        this.historique = historique;
    }
}