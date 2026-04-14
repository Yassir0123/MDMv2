package com.web.mdm.Repository.projection;

import java.time.LocalDate;

public interface CarteSimDashboardProjection {
    Integer getId();
    String getStatus();
    String getStatusAffectation();
    Integer getAgenceId();
    LocalDate getDateCreation();
}
