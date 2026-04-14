package com.web.mdm.Dto;

public class HelpdeskTicketSummaryDto {
    private Integer id;
    private String status;
    private String subject;
    private String importance;
    private String impact;
    private String flag;
    private String dateSent;
    private Integer sousCategoryId;
    private String category;
    private String localisation;
    private String type;
    private Integer senderId;
    private String senderName;
    private Integer applierId;
    private String applierName;
    private String applierMatricule;
    private Integer closeDelay;
    private boolean canReply;
    private boolean observerOnly;
    private boolean canClaim;
    private boolean claimedByCurrentUser;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getImportance() {
        return importance;
    }

    public void setImportance(String importance) {
        this.importance = importance;
    }

    public String getImpact() {
        return impact;
    }

    public void setImpact(String impact) {
        this.impact = impact;
    }

    public String getFlag() {
        return flag;
    }

    public void setFlag(String flag) {
        this.flag = flag;
    }

    public String getDateSent() {
        return dateSent;
    }

    public void setDateSent(String dateSent) {
        this.dateSent = dateSent;
    }

    public Integer getSousCategoryId() {
        return sousCategoryId;
    }

    public void setSousCategoryId(Integer sousCategoryId) {
        this.sousCategoryId = sousCategoryId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocalisation() {
        return localisation;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getSenderId() {
        return senderId;
    }

    public void setSenderId(Integer senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public Integer getApplierId() {
        return applierId;
    }

    public void setApplierId(Integer applierId) {
        this.applierId = applierId;
    }

    public String getApplierName() {
        return applierName;
    }

    public void setApplierName(String applierName) {
        this.applierName = applierName;
    }

    public String getApplierMatricule() {
        return applierMatricule;
    }

    public void setApplierMatricule(String applierMatricule) {
        this.applierMatricule = applierMatricule;
    }

    public Integer getCloseDelay() {
        return closeDelay;
    }

    public void setCloseDelay(Integer closeDelay) {
        this.closeDelay = closeDelay;
    }

    public boolean isCanReply() {
        return canReply;
    }

    public void setCanReply(boolean canReply) {
        this.canReply = canReply;
    }

    public boolean isObserverOnly() {
        return observerOnly;
    }

    public void setObserverOnly(boolean observerOnly) {
        this.observerOnly = observerOnly;
    }

    public boolean isCanClaim() {
        return canClaim;
    }

    public void setCanClaim(boolean canClaim) {
        this.canClaim = canClaim;
    }

    public boolean isClaimedByCurrentUser() {
        return claimedByCurrentUser;
    }

    public void setClaimedByCurrentUser(boolean claimedByCurrentUser) {
        this.claimedByCurrentUser = claimedByCurrentUser;
    }
}
