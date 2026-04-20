package com.web.mdm.Dto;

import java.time.LocalDateTime;
import java.util.List;

public record DashboardSummaryDto(
        List<UserSummaryDto> users,
        List<MobileSummaryDto> mobiles,
        List<CarteSimSummaryDto> sims,
        List<LigneInternetSummaryDto> internetLines,
        List<MaterielSummaryDto> materiels,
        HelpdeskSummaryDto helpdesk) {

    public record AgencySummaryDto(Integer id, String nom) {
    }

    public record DepartementSummaryDto(Integer id, String nom) {
    }

    public record EntrepotSummaryDto(Integer id, String nom) {
    }

    public record UserSummaryDto(
            Integer id, 
            String status, 
            AgencySummaryDto agence,
            DepartementSummaryDto departement,
            EntrepotSummaryDto entrepot) {
    }

    public record MobileSummaryDto(
            Integer id,
            String type,
            String status,
            String statusAffectation,
            Integer agenceId,
            Integer userId,
            Integer departementId,
            Integer entrepotId,
            LocalDateTime dateCreation) {
    }

    public record CarteSimSummaryDto(
            Integer id,
            String status,
            String statusAffectation,
            Integer agenceId,
            LocalDateTime dateCreation) {
    }

    public record LigneInternetSummaryDto(
            Integer id,
            String status,
            String statusAffectation,
            Integer agenceId,
            LocalDateTime dateCreation) {
    }

    public record MaterielSummaryDto(
            Integer id,
            String typeMateriel,
            String status,
            String statusAffectation,
            Integer agenceId,
            Integer userId,
            Integer departementId,
            Integer entrepotId,
            LocalDateTime dateCreation) {
    }

    public record HelpdeskMetricDto(
            String key,
            String label,
            long value) {
    }

    public record HelpdeskTrendPointDto(
            String date,
            String label,
            long created,
            long enAttente,
            long enProgress,
            long resolu,
            long clos) {
    }

    public record HelpdeskSummaryDto(
            long totalTickets,
            long newTickets,
            long pendingTickets,
            long inProgressTickets,
            long resolvedTickets,
            long closedTickets,
            long claimEvents,
            long resolvedByCurrentUser,
            List<HelpdeskMetricDto> overviewBreakdown,
            List<HelpdeskMetricDto> importanceBreakdown,
            List<HelpdeskMetricDto> impactBreakdown,
            List<HelpdeskTrendPointDto> trend) {
    }
}
