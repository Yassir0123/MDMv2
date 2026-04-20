package com.web.mdm.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class Archive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer typeId;
    private String type = "Ressource";
    
    private String nom;
    private String prenom;
    private String sn;
    private String operateur;
    private String nomMateriel;
    
    private LocalDateTime dateDeletion;

    public Archive() {
    }

    public Archive(Integer typeId, String type, String nom, String prenom, String sn, String operateur, String nomMateriel, LocalDateTime dateDeletion) {
        this.typeId = typeId;
        this.type = type;
        this.nom = nom;
        this.prenom = prenom;
        this.sn = sn;
        this.operateur = operateur;
        this.nomMateriel = nomMateriel;
        this.dateDeletion = dateDeletion;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getTypeId() {
        return typeId;
    }

    public void setTypeId(Integer typeId) {
        this.typeId = typeId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getSn() {
        return sn;
    }

    public void setSn(String sn) {
        this.sn = sn;
    }

    public String getOperateur() {
        return operateur;
    }

    public void setOperateur(String operateur) {
        this.operateur = operateur;
    }

    public String getNomMateriel() {
        return nomMateriel;
    }

    public void setNomMateriel(String nomMateriel) {
        this.nomMateriel = nomMateriel;
    }

    public LocalDateTime getDateDeletion() {
        return dateDeletion;
    }

    public void setDateDeletion(LocalDateTime dateDeletion) {
        this.dateDeletion = dateDeletion;
    }
}
