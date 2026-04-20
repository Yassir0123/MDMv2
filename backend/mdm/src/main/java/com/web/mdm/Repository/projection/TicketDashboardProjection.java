package com.web.mdm.Repository.projection;

import java.time.LocalDateTime;

public interface TicketDashboardProjection {
    Integer getId();

    String getStatus();

    String getType();

    String getImportance();

    String getImpact();

    LocalDateTime getDateSent();

    Integer getSenderAgenceId();

    Integer getApplierId();
}
