package com.web.mdm.Models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class CarteSim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String sn;

    private String numero;
    private String operateur;
    private String pin;
    private String pin2;
    private String puk;
    private String puk2;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private StatusAffectation statusAffectation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrepot")
    private Entrepot entrepot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departement_id")
    private Departement departement;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    private LocalDateTime dateAnnuler;
    private LocalDateTime dateRecu; // When the USER received it
    private LocalDateTime dateEnvoie; // When the Admin sent/assigned it
    private String tarif;
    private String typeForfait;
    // --- NEW FIELD ---
    private LocalDateTime dateCreation; // When the SIM was added to MDM

    // FIX: Added 'creation' to Enum as requested
    public enum Status {
        active, inactive
    }

    // Add 'creation' here (Lifecycle State)
    public enum StatusAffectation {
        non_affecter, en_attente, recu, annuler, affecter, creation
    }

    @OneToMany(mappedBy = "materiel")
    @JsonIgnore
    private List<HistoriqueCartesim> historique;

    // Getters and Setters (Keep others, add new ones)
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

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
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

    // New Getter/Setter
    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public List<HistoriqueCartesim> getHistorique() {
        return historique;
    }

    public void setHistorique(List<HistoriqueCartesim> historique) {
        this.historique = historique;
    }

    public String getTarif() {
        return tarif;
    }

    public void setTarif(String tarif) {
        this.tarif = tarif;
    }

    public String getTypeForfait() {
        return typeForfait;
    }

    public void setTypeForfait(String typeForfait) {
        this.typeForfait = typeForfait;
    }
}
