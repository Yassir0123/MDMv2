package com.web.mdm.Repository.projection;

import java.time.LocalDateTime;

public interface HistoriqueTicketDashboardProjection {
    Integer getId();

    String getStatusEvent();

    LocalDateTime getDateEvent();

    Integer getTicketSenderAgenceId();
}
