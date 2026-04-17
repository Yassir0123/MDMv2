package com.web.mdm.Models;

public interface ManagerTrackedHistory {
    Integer resolveTargetUserId();

    Integer getManagerId();

    void setManagerId(Integer managerId);
}
