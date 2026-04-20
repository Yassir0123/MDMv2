package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "materiels") // Plural as requested
public class Materiels {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String sn;
    private String designation;
    private String marque;

    @Column(name = "type_materiel")
    private String typeMateriel; // "Ordinateur portable", "Souris", etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id")
    private Departement departement;

    private String status; // "active", "inactive"
    private String statusAffectation; // "non_affecter", "affecter", etc.

    private LocalDateTime dateCreation;
    private LocalDateTime dateRecu;
    private LocalDateTime dateAnnuler;
    private LocalDateTime dateEnvoie;

    @OneToMany(mappedBy = "materiels", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<HistoriqueMateriels> historique;

    // Getters & Setters
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

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getMarque() {
        return marque;
    }

    public void setMarque(String marque) {
        this.marque = marque;
    }

    public String getTypeMateriel() {
        return typeMateriel;
    }

    public void setTypeMateriel(String typeMateriel) {
        this.typeMateriel = typeMateriel;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
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

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
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

    public LocalDateTime getDateEnvoie() {
        return dateEnvoie;
    }

    public void setDateEnvoie(LocalDateTime dateEnvoie) {
        this.dateEnvoie = dateEnvoie;
    }

    public List<HistoriqueMateriels> getHistorique() {
        return historique;
    }

    public void setHistorique(List<HistoriqueMateriels> historique) {
        this.historique = historique;
    }
}