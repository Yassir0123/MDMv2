package com.web.mdm.Dto;

import java.time.LocalDate;

public class MobileDto {
    private Integer id;
    private String sn;
    private String imei;
    private String nom;
    private String marque;
    private String model;
    private String type;
    private String status;
    private String statusAffectation;
    
    private Integer agenceId;
    private String agenceNom;

    private Integer entrepotId;
    private String entrepotNom;
    
    private Integer userId;
    private String userNom;
    
    private Integer departementId;
    private String departementNom;
    
    private LocalDate dateEnvoie;
    private LocalDate dateCreation;

    public MobileDto(Integer id, String sn, String imei, String nom, String marque, String model, 
                     String type, String status, String statusAffectation,
                     Integer agenceId, String agenceNom,
                     Integer entrepotId, String entrepotNom,
                     Integer userId, String userNom,
                     Integer departementId, String departementNom,
                     LocalDate dateEnvoie, LocalDate dateCreation) {
        this.id = id;
        this.sn = sn;
        this.imei = imei;
        this.nom = nom;
        this.marque = marque;
        this.model = model;
        this.type = type;
        this.status = status;
        this.statusAffectation = statusAffectation;
        this.agenceId = agenceId;
        this.agenceNom = agenceNom;
        this.entrepotId = entrepotId;
        this.entrepotNom = entrepotNom;
        this.userId = userId;
        this.userNom = userNom;
        this.departementId = departementId;
        this.departementNom = departementNom;
        this.dateEnvoie = dateEnvoie;
        this.dateCreation = dateCreation;
    }

    // Getters
    public Integer getId() { return id; }
    public String getSn() { return sn; }
    public String getImei() { return imei; }
    public String getNom() { return nom; }
    public String getMarque() { return marque; }
    public String getModel() { return model; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getStatusAffectation() { return statusAffectation; }
    public Integer getAgenceId() { return agenceId; }
    public String getAgenceNom() { return agenceNom; }
    public Integer getEntrepotId() { return entrepotId; }
    public String getEntrepotNom() { return entrepotNom; }
    public Integer getUserId() { return userId; }
    public String getUserNom() { return userNom; }
    public Integer getDepartementId() { return departementId; }
    public String getDepartementNom() { return departementNom; }
    public LocalDate getDateEnvoie() { return dateEnvoie; }
    public LocalDate getDateCreation() { return dateCreation; }
}