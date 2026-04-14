package com.web.mdm.Dto;

import java.util.ArrayList;
import java.util.List;

public class TicketAdminUpdateRequest {
    private String status;
    private String importance;
    private String impact;
    private List<Integer> observerIds = new ArrayList<>();
    private List<Integer> targetIds = new ArrayList<>();

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public List<Integer> getObserverIds() {
        return observerIds;
    }

    public void setObserverIds(List<Integer> observerIds) {
        this.observerIds = observerIds;
    }

    public List<Integer> getTargetIds() {
        return targetIds;
    }

    public void setTargetIds(List<Integer> targetIds) {
        this.targetIds = targetIds;
    }
}
