package com.web.mdm.Repository.projection;

import java.time.LocalDateTime;

public interface CarteSimDashboardProjection {
    Integer getId();
    String getStatus();
    String getStatusAffectation();
    Integer getAgenceId();
    LocalDateTime getDateCreation();
}
