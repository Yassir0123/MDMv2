package com.web.mdm.Dto;

import java.time.LocalDateTime;

public class LigneInternetDto {
    private Integer id;
    private String sn; // "Number"
    private String operateur;
    private String vitesse;
    private String status;
    private String statusAffectation;
    
    private Integer agenceId;
    private String agenceNom; // "Site"

    private Integer entrepotId;
    private String entrepotNom;
    
    private Integer departementId;
    private String departementNom;
    
    private LocalDateTime dateEnvoie;
    private LocalDateTime dateCreation;

    public LigneInternetDto(Integer id, String sn, String operateur, String vitesse, 
                            String status, String statusAffectation,
                            Integer agenceId, String agenceNom,
                            Integer entrepotId, String entrepotNom,
                            Integer departementId, String departementNom,
                            LocalDateTime dateEnvoie, LocalDateTime dateCreation) {
        this.id = id;
        this.sn = sn;
        this.operateur = operateur;
        this.vitesse = vitesse;
        this.status = status;
        this.statusAffectation = statusAffectation;
        this.agenceId = agenceId;
        this.agenceNom = agenceNom;
        this.entrepotId = entrepotId;
        this.entrepotNom = entrepotNom;
        this.departementId = departementId;
        this.departementNom = departementNom;
        this.dateEnvoie = dateEnvoie;
        this.dateCreation = dateCreation;
    }

    // Getters
    public Integer getId() { return id; }
    public String getSn() { return sn; }
    public String getOperateur() { return operateur; }
    public String getVitesse() { return vitesse; }
    public String getStatus() { return status; }
    public String getStatusAffectation() { return statusAffectation; }
    public Integer getAgenceId() { return agenceId; }
    public String getAgenceNom() { return agenceNom; }
    public Integer getEntrepotId() { return entrepotId; }
    public String getEntrepotNom() { return entrepotNom; }
    public Integer getDepartementId() { return departementId; }
    public String getDepartementNom() { return departementNom; }
    public LocalDateTime getDateEnvoie() { return dateEnvoie; }
    public LocalDateTime getDateCreation() { return dateCreation; }
}