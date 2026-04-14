package com.web.mdm.Dto;

import java.time.LocalDate;

public class CarteSimDto {
    private Integer id;
    private String sn;
    private String numero;
    private String operateur;
    
    // --- 1. NEW FIELDS ---
    private String tarif;
    private String typeForfait;
    // ---------------------

    private String pin;
    private String pin2;
    private String puk;
    private String puk2;
    private String status;
    private String statusAffectation;
    private Integer agenceId;
    private String agenceNom;
    private Integer entrepotId;
    private String entrepotNom;
    private Integer departementId;
    private Integer userId;
    private String userNom; 
    private String departementNom;
    private LocalDate dateEnvoie;
    private LocalDate dateCreation;

    // --- 2. UPDATED CONSTRUCTOR ---
    public CarteSimDto(Integer id, String sn, String numero, String operateur, 
                   String tarif, String typeForfait, // <--- Added Arguments
                   String pin, String pin2, String puk, String puk2, 
                   String status, String statusAffectation,
                   Integer agenceId, String agenceNom,
                   Integer entrepotId, String entrepotNom,
                   Integer departementId, String departementNom,
                   Integer userId, String userNom, 
                   LocalDate dateEnvoie, LocalDate dateCreation){
        this.id = id;
        this.sn = sn;
        this.numero = numero;
        this.operateur = operateur;
        
        this.tarif = tarif;           // <--- Assigned
        this.typeForfait = typeForfait; // <--- Assigned
        
        this.pin = pin;
        this.pin2 = pin2;
        this.puk = puk;
        this.puk2 = puk2;
        this.status = status;
        this.statusAffectation = statusAffectation;
        this.agenceId = agenceId;
        this.agenceNom = agenceNom;
        this.entrepotId = entrepotId;
        this.entrepotNom = entrepotNom;
        this.departementId = departementId;
        this.userId = userId;
        this.userNom = userNom;
        this.departementNom = departementNom;
        this.dateEnvoie = dateEnvoie;
        this.dateCreation = dateCreation;
    }

    // --- 3. GETTERS (CRITICAL FOR JSON) ---
    public Integer getId() { return id; }
    public String getSn() { return sn; }
    public String getNumero() { return numero; }
    public String getOperateur() { return operateur; }
    
    // *** NEW GETTERS ***
    public String getTarif() { return tarif; }
    public String getTypeForfait() { return typeForfait; }
    // *******************
    
    public String getPin() { return pin; }
    public String getPin2() { return pin2; }
    public LocalDate getDateCreation() { return dateCreation; }
    public String getPuk() { return puk; }
    public String getPuk2() { return puk2; }
    public String getStatus() { return status; }
    public String getStatusAffectation() { return statusAffectation; }
    public Integer getAgenceId() { return agenceId; }
    public String getAgenceNom() { return agenceNom; }
    public Integer getEntrepotId() { return entrepotId; }
    public String getEntrepotNom() { return entrepotNom; }
    public Integer getDepartementId() { return departementId; }
    public Integer getUserId() { return userId; }
    public String getUserNom() { return userNom; }
    public String getDepartementNom() { return departementNom; }
    public LocalDate getDateEnvoie() { return dateEnvoie; }
}