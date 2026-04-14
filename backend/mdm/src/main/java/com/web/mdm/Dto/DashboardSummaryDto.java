package com.web.mdm.Dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardSummaryDto(
        List<UserSummaryDto> users,
        List<MobileSummaryDto> mobiles,
        List<CarteSimSummaryDto> sims,
        List<LigneInternetSummaryDto> internetLines,
        List<MaterielSummaryDto> materiels) {

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
            LocalDate dateCreation) {
    }

    public record CarteSimSummaryDto(
            Integer id,
            String status,
            String statusAffectation,
            Integer agenceId,
            LocalDate dateCreation) {
    }

    public record LigneInternetSummaryDto(
            Integer id,
            String status,
            String statusAffectation,
            Integer agenceId,
            LocalDate dateCreation) {
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
            LocalDate dateCreation) {
    }
}
