package com.web.mdm.Repository.projection;

import java.time.LocalDateTime;

public interface LigneInternetDashboardProjection {
    Integer getId();
    String getStatus();
    String getStatusAffectation();
    Integer getAgenceId();
    LocalDateTime getDateCreation();
}
