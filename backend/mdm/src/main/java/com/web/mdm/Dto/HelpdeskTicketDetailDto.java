package com.web.mdm.Dto;

import java.util.ArrayList;
import java.util.List;

public class HelpdeskTicketDetailDto extends HelpdeskTicketSummaryDto {
    private String viewerMode;
    private boolean canAdminManage;
    private boolean canReply;
    private String body;
    private HelpdeskUserOptionDto demandeur;
    private List<HelpdeskUserOptionDto> observers = new ArrayList<>();
    private List<HelpdeskUserOptionDto> targets = new ArrayList<>();
    private List<HelpdeskDeviceOptionDto> devices = new ArrayList<>();
    private List<HelpdeskMessageDto> messages = new ArrayList<>();
    private List<HelpdeskFileDto> files = new ArrayList<>();

    public String getViewerMode() {
        return viewerMode;
    }

    public void setViewerMode(String viewerMode) {
        this.viewerMode = viewerMode;
    }

    public boolean isCanAdminManage() {
        return canAdminManage;
    }

    public void setCanAdminManage(boolean canAdminManage) {
        this.canAdminManage = canAdminManage;
    }

    @Override
    public boolean isCanReply() {
        return canReply;
    }

    @Override
    public void setCanReply(boolean canReply) {
        this.canReply = canReply;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public HelpdeskUserOptionDto getDemandeur() {
        return demandeur;
    }

    public void setDemandeur(HelpdeskUserOptionDto demandeur) {
        this.demandeur = demandeur;
    }

    public List<HelpdeskUserOptionDto> getObservers() {
        return observers;
    }

    public void setObservers(List<HelpdeskUserOptionDto> observers) {
        this.observers = observers;
    }

    public List<HelpdeskUserOptionDto> getTargets() {
        return targets;
    }

    public void setTargets(List<HelpdeskUserOptionDto> targets) {
        this.targets = targets;
    }

    public List<HelpdeskDeviceOptionDto> getDevices() {
        return devices;
    }

    public void setDevices(List<HelpdeskDeviceOptionDto> devices) {
        this.devices = devices;
    }

    public List<HelpdeskMessageDto> getMessages() {
        return messages;
    }

    public void setMessages(List<HelpdeskMessageDto> messages) {
        this.messages = messages;
    }

    public List<HelpdeskFileDto> getFiles() {
        return files;
    }

    public void setFiles(List<HelpdeskFileDto> files) {
        this.files = files;
    }
}
