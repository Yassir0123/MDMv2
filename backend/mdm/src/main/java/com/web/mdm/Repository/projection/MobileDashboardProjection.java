package com.web.mdm.Repository.projection;

import java.time.LocalDateTime;

public interface MobileDashboardProjection {
    Integer getId();

    String getType();

    String getStatus();

    String getStatusAffectation();

    Integer getAgenceId();

    Integer getUserId();

    Integer getDepartementId();

    Integer getEntrepotId();

    LocalDateTime getDateCreation();
}
