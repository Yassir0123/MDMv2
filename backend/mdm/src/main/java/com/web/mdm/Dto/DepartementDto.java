package com.web.mdm.Dto;

public class DepartementDto {
    private Integer id;
    private String nom;
    private Integer effective; // stored on entity
    private Integer totalEffectif; // live count from users list
    private Integer agenceId;
    private String agenceNom;

    // Chef info
    private Integer chefDepartementId;
    private String chefDepartementNom;

    public DepartementDto() {
    }

    public DepartementDto(Integer id, String nom, Integer effective, Integer totalEffectif,
            Integer agenceId, String agenceNom,
            Integer chefDepartementId, String chefDepartementNom) {
        this.id = id;
        this.nom = nom;
        this.effective = effective;
        this.totalEffectif = totalEffectif;
        this.agenceId = agenceId;
        this.agenceNom = agenceNom;
        this.chefDepartementId = chefDepartementId;
        this.chefDepartementNom = chefDepartementNom;
    }

    // Getters
    public Integer getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public Integer getEffective() {
        return effective;
    }

    public Integer getTotalEffectif() {
        return totalEffectif;
    }

    public Integer getAgenceId() {
        return agenceId;
    }

    public String getAgenceNom() {
        return agenceNom;
    }

    public Integer getChefDepartementId() {
        return chefDepartementId;
    }

    public String getChefDepartementNom() {
        return chefDepartementNom;
    }

    // Setters
    public void setId(Integer id) {
        this.id = id;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setEffective(Integer effective) {
        this.effective = effective;
    }

    public void setTotalEffectif(Integer totalEffectif) {
        this.totalEffectif = totalEffectif;
    }

    public void setAgenceId(Integer agenceId) {
        this.agenceId = agenceId;
    }

    public void setAgenceNom(String agenceNom) {
        this.agenceNom = agenceNom;
    }

    public void setChefDepartementId(Integer chefDepartementId) {
        this.chefDepartementId = chefDepartementId;
    }

    public void setChefDepartementNom(String chefDepartementNom) {
        this.chefDepartementNom = chefDepartementNom;
    }
}
