package com.web.mdm.Repository.projection;

import java.time.LocalDate;

public interface MobileDashboardProjection {
    Integer getId();

    String getType();

    String getStatus();

    String getStatusAffectation();

    Integer getAgenceId();

    Integer getUserId();

    Integer getDepartementId();

    Integer getEntrepotId();

    LocalDate getDateCreation();
}
