package com.web.mdm.Repository.projection;

import java.time.LocalDate;

public interface MaterielDashboardProjection {
    Integer getId();
    String getTypeMateriel();
    String getStatus();
    String getStatusAffectation();
    Integer getAgenceId();
    Integer getUserId();
    Integer getDepartementId();
    Integer getEntrepotId();
    LocalDate getDateCreation();
}
