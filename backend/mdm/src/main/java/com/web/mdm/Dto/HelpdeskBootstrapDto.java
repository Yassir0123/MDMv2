package com.web.mdm.Dto;

import java.util.ArrayList;
import java.util.List;

public class HelpdeskBootstrapDto {
    private boolean canCreate;
    private String role;
    private String defaultLocation;
    private HelpdeskUserOptionDto currentUser;
    private List<String> allowedScopes = new ArrayList<>();
    private List<HelpdeskUserOptionDto> observerOptions = new ArrayList<>();
    private List<HelpdeskUserOptionDto> targetOptions = new ArrayList<>();
    private List<HelpdeskDeviceOptionDto> myDevices = new ArrayList<>();
    private List<HelpdeskDeviceOptionDto> collaboratorDevices = new ArrayList<>();

    public boolean isCanCreate() {
        return canCreate;
    }

    public void setCanCreate(boolean canCreate) {
        this.canCreate = canCreate;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDefaultLocation() {
        return defaultLocation;
    }

    public void setDefaultLocation(String defaultLocation) {
        this.defaultLocation = defaultLocation;
    }

    public HelpdeskUserOptionDto getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(HelpdeskUserOptionDto currentUser) {
        this.currentUser = currentUser;
    }

    public List<String> getAllowedScopes() {
        return allowedScopes;
    }

    public void setAllowedScopes(List<String> allowedScopes) {
        this.allowedScopes = allowedScopes;
    }

    public List<HelpdeskUserOptionDto> getObserverOptions() {
        return observerOptions;
    }

    public void setObserverOptions(List<HelpdeskUserOptionDto> observerOptions) {
        this.observerOptions = observerOptions;
    }

    public List<HelpdeskUserOptionDto> getTargetOptions() {
        return targetOptions;
    }

    public void setTargetOptions(List<HelpdeskUserOptionDto> targetOptions) {
        this.targetOptions = targetOptions;
    }

    public List<HelpdeskDeviceOptionDto> getMyDevices() {
        return myDevices;
    }

    public void setMyDevices(List<HelpdeskDeviceOptionDto> myDevices) {
        this.myDevices = myDevices;
    }

    public List<HelpdeskDeviceOptionDto> getCollaboratorDevices() {
        return collaboratorDevices;
    }

    public void setCollaboratorDevices(List<HelpdeskDeviceOptionDto> collaboratorDevices) {
        this.collaboratorDevices = collaboratorDevices;
    }
}
