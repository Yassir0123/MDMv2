package com.web.mdm.Dto;

import java.time.LocalDateTime;

public class MaterielsDto {
    private Integer id;
    private String sn;
    private String designation;
    private String marque;
    private String typeMateriel;
    private String status;
    private String statusAffectation;
    
    private Integer agenceId;
    private String agenceNom;
    private Integer entrepotId;
    private String entrepotNom;
    private Integer departementId;
    private String departementNom;
    private Integer userId;
    private String userNom; // Full Name

    private LocalDateTime dateCreation;
    private LocalDateTime dateEnvoie;

    public MaterielsDto(Integer id, String sn, String designation, String marque, String typeMateriel,
                        String status, String statusAffectation, Integer agenceId, String agenceNom,
                        Integer entrepotId, String entrepotNom,
                        Integer departementId, String departementNom, Integer userId, String userNom,
                        LocalDateTime dateCreation, LocalDateTime dateEnvoie) {
        this.id = id;
        this.sn = sn;
        this.designation = designation;
        this.marque = marque;
        this.typeMateriel = typeMateriel;
        this.status = status;
        this.statusAffectation = statusAffectation;
        this.agenceId = agenceId;
        this.agenceNom = agenceNom;
        this.entrepotId = entrepotId;
        this.entrepotNom = entrepotNom;
        this.departementId = departementId;
        this.departementNom = departementNom;
        this.userId = userId;
        this.userNom = userNom;
        this.dateCreation = dateCreation;
        this.dateEnvoie = dateEnvoie;
    }

    // Getters needed for serialization
    public Integer getId() { return id; }
    public String getSn() { return sn; }
    public String getDesignation() { return designation; }
    public String getMarque() { return marque; }
    public String getTypeMateriel() { return typeMateriel; }
    public String getStatus() { return status; }
    public String getStatusAffectation() { return statusAffectation; }
    public Integer getAgenceId() { return agenceId; }
    public String getAgenceNom() { return agenceNom; }
    public Integer getEntrepotId() { return entrepotId; }
    public String getEntrepotNom() { return entrepotNom; }
    public Integer getDepartementId() { return departementId; }
    public String getDepartementNom() { return departementNom; }
    public Integer getUserId() { return userId; }
    public String getUserNom() { return userNom; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public LocalDateTime getDateEnvoie() { return dateEnvoie; }
}