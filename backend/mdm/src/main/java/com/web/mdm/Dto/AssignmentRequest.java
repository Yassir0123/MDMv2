package com.web.mdm.Dto;

public class AssignmentRequest {
    private Integer userId;
    private Integer materielId;
    private Integer departementId;
    private Integer agenceId; // <--- NEW: Added for Internet Line assignment
    private Integer entrepotId;

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getMaterielId() { return materielId; }
    public void setMaterielId(Integer materielId) { this.materielId = materielId; }
    public Integer getDepartementId() { return departementId; }
    public void setDepartementId(Integer departementId) { this.departementId = departementId; }
    public Integer getAgenceId() { return agenceId; }
    public void setAgenceId(Integer agenceId) { this.agenceId = agenceId; }

    public Integer getEntrepotId() { return entrepotId; }
    public void setEntrepotId(Integer entrepotId) { this.entrepotId = entrepotId; }
}