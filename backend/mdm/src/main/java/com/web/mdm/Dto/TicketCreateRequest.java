package com.web.mdm.Dto;

import java.util.ArrayList;
import java.util.List;

public class TicketCreateRequest {
    private String subject;
    private String body;
    private String type;
    private String flag;
    private Integer sousCategoryId;
    private String localisation;
    private List<Integer> deviceIds = new ArrayList<>();
    private List<Integer> observerIds = new ArrayList<>();

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFlag() {
        return flag;
    }

    public void setFlag(String flag) {
        this.flag = flag;
    }

    public Integer getSousCategoryId() {
        return sousCategoryId;
    }

    public void setSousCategoryId(Integer sousCategoryId) {
        this.sousCategoryId = sousCategoryId;
    }

    public String getLocalisation() {
        return localisation;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public List<Integer> getDeviceIds() {
        return deviceIds;
    }

    public void setDeviceIds(List<Integer> deviceIds) {
        this.deviceIds = deviceIds;
    }

    public List<Integer> getObserverIds() {
        return observerIds;
    }

    public void setObserverIds(List<Integer> observerIds) {
        this.observerIds = observerIds;
    }
}
