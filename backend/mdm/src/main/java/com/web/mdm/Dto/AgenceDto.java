package com.web.mdm.Dto;

public class AgenceDto {
    private Integer id;
    private String nom;
    private String email;
    private String tel;
    private String fax;

    // Ville Info
    private Integer villeId;
    private String villeNom;

    // Chef Info
    private Integer chefAgenceId;
    private String chefAgenceNom;

    // KPI fields
    private Integer totalEffectif;
    private Integer totalVilles;

    public AgenceDto() {
    }

    public AgenceDto(Integer id, String nom, String email, String tel, String fax,
            Integer villeId, String villeNom,
            Integer chefAgenceId, String chefAgenceNom,
            Integer totalEffectif, Integer totalVilles) {
        this.id = id;
        this.nom = nom;
        this.email = email;
        this.tel = tel;
        this.fax = fax;
        this.villeId = villeId;
        this.villeNom = villeNom;
        this.chefAgenceId = chefAgenceId;
        this.chefAgenceNom = chefAgenceNom;
        this.totalEffectif = totalEffectif;
        this.totalVilles = totalVilles;
    }

    // Getters
    public Integer getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public String getEmail() {
        return email;
    }

    public String getTel() {
        return tel;
    }

    public String getFax() {
        return fax;
    }

    public Integer getVilleId() {
        return villeId;
    }

    public String getVilleNom() {
        return villeNom;
    }

    public Integer getChefAgenceId() {
        return chefAgenceId;
    }

    public String getChefAgenceNom() {
        return chefAgenceNom;
    }

    public Integer getTotalEffectif() {
        return totalEffectif;
    }

    public Integer getTotalVilles() {
        return totalVilles;
    }

    // Setters
    public void setId(Integer id) {
        this.id = id;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public void setFax(String fax) {
        this.fax = fax;
    }

    public void setVilleId(Integer villeId) {
        this.villeId = villeId;
    }

    public void setVilleNom(String villeNom) {
        this.villeNom = villeNom;
    }

    public void setChefAgenceId(Integer chefAgenceId) {
        this.chefAgenceId = chefAgenceId;
    }

    public void setChefAgenceNom(String chefAgenceNom) {
        this.chefAgenceNom = chefAgenceNom;
    }

    public void setTotalEffectif(Integer totalEffectif) {
        this.totalEffectif = totalEffectif;
    }

    public void setTotalVilles(Integer totalVilles) {
        this.totalVilles = totalVilles;
    }
}