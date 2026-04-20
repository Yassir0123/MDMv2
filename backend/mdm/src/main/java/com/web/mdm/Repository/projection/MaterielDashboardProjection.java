package com.web.mdm.Repository.projection;

import java.time.LocalDateTime;

public interface MaterielDashboardProjection {
    Integer getId();
    String getTypeMateriel();
    String getStatus();
    String getStatusAffectation();
    Integer getAgenceId();
    Integer getUserId();
    Integer getDepartementId();
    Integer getEntrepotId();
    LocalDateTime getDateCreation();
}
