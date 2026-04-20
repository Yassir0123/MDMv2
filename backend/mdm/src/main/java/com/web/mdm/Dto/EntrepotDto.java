package com.web.mdm.Dto;

public class EntrepotDto {
    private Integer id;
    private Integer siteId;
    private String siteNom;
    private String telephone;
    private String email;
    private String fax;
    private Integer chefEntrepotId;
    private String chefEntrepotNom;
    private Integer totalEffectif;
    private Integer totalSites;

    public EntrepotDto() {
    }

    public EntrepotDto(Integer id, Integer siteId, String siteNom, String telephone, String email, String fax,
            Integer chefEntrepotId, String chefEntrepotNom, Integer totalEffectif, Integer totalSites) {
        this.id = id;
        this.siteId = siteId;
        this.siteNom = siteNom;
        this.telephone = telephone;
        this.email = email;
        this.fax = fax;
        this.chefEntrepotId = chefEntrepotId;
        this.chefEntrepotNom = chefEntrepotNom;
        this.totalEffectif = totalEffectif;
        this.totalSites = totalSites;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSiteId() {
        return siteId;
    }

    public void setSiteId(Integer siteId) {
        this.siteId = siteId;
    }

    public String getSiteNom() {
        return siteNom;
    }

    public void setSiteNom(String siteNom) {
        this.siteNom = siteNom;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFax() {
        return fax;
    }

    public void setFax(String fax) {
        this.fax = fax;
    }

    public Integer getChefEntrepotId() {
        return chefEntrepotId;
    }

    public void setChefEntrepotId(Integer chefEntrepotId) {
        this.chefEntrepotId = chefEntrepotId;
    }

    public String getChefEntrepotNom() {
        return chefEntrepotNom;
    }

    public void setChefEntrepotNom(String chefEntrepotNom) {
        this.chefEntrepotNom = chefEntrepotNom;
    }

    public Integer getTotalEffectif() {
        return totalEffectif;
    }

    public void setTotalEffectif(Integer totalEffectif) {
        this.totalEffectif = totalEffectif;
    }

    public Integer getTotalSites() {
        return totalSites;
    }

    public void setTotalSites(Integer totalSites) {
        this.totalSites = totalSites;
    }
}
