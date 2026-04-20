package com.web.mdm.Services;

import com.web.mdm.Dto.DashboardSummaryDto;
import com.web.mdm.Models.Compte;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CarteSimRepository;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.HistoriqueTicketRepository;
import com.web.mdm.Repository.LigneInternetRepository;
import com.web.mdm.Repository.MaterielsRepository;
import com.web.mdm.Repository.MobileRepository;
import com.web.mdm.Repository.TicketRepository;
import com.web.mdm.Repository.UsersRepository;
import com.web.mdm.Repository.projection.HistoriqueTicketDashboardProjection;
import com.web.mdm.Repository.projection.TicketDashboardProjection;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;

@Service
public class DashboardService {
    private static final DateTimeFormatter DASHBOARD_DATE_LABEL = DateTimeFormatter.ofPattern("dd/MM");

    private final UsersRepository usersRepository;
    private final MobileRepository mobileRepository;
    private final CarteSimRepository carteSimRepository;
    private final LigneInternetRepository ligneInternetRepository;
    private final MaterielsRepository materielsRepository;
    private final CompteRepository compteRepository;
    private final TicketRepository ticketRepository;
    private final HistoriqueTicketRepository historiqueTicketRepository;

    public DashboardService(
            UsersRepository usersRepository,
            MobileRepository mobileRepository,
            CarteSimRepository carteSimRepository,
            LigneInternetRepository ligneInternetRepository,
            MaterielsRepository materielsRepository,
            CompteRepository compteRepository,
            TicketRepository ticketRepository,
            HistoriqueTicketRepository historiqueTicketRepository) {
        this.usersRepository = usersRepository;
        this.mobileRepository = mobileRepository;
        this.carteSimRepository = carteSimRepository;
        this.ligneInternetRepository = ligneInternetRepository;
        this.materielsRepository = materielsRepository;
        this.compteRepository = compteRepository;
        this.ticketRepository = ticketRepository;
        this.historiqueTicketRepository = historiqueTicketRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        List<DashboardSummaryDto.UserSummaryDto> users = usersRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.UserSummaryDto(
                        item.getId(),
                        item.getStatus(),
                        item.getAgenceId() == null ? null : new DashboardSummaryDto.AgencySummaryDto(item.getAgenceId(), item.getAgenceNom()),
                        item.getDepartementId() == null ? null : new DashboardSummaryDto.DepartementSummaryDto(item.getDepartementId(), item.getDepartementNom()),
                        item.getEntrepotId() == null ? null : new DashboardSummaryDto.EntrepotSummaryDto(item.getEntrepotId(), item.getEntrepotNom())))
                .toList();

        List<DashboardSummaryDto.MobileSummaryDto> mobiles = mobileRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.MobileSummaryDto(
                        item.getId(),
                        item.getType(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getUserId(),
                        item.getDepartementId(),
                        item.getEntrepotId(),
                        item.getDateCreation()))
                .toList();

        List<DashboardSummaryDto.CarteSimSummaryDto> sims = carteSimRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.CarteSimSummaryDto(
                        item.getId(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getDateCreation()))
                .toList();

        List<DashboardSummaryDto.LigneInternetSummaryDto> internetLines = ligneInternetRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.LigneInternetSummaryDto(
                        item.getId(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getDateCreation()))
                .toList();

        List<DashboardSummaryDto.MaterielSummaryDto> materiels = materielsRepository.findAllDashboardSummaries().stream()
                .map(item -> new DashboardSummaryDto.MaterielSummaryDto(
                        item.getId(),
                        item.getTypeMateriel(),
                        item.getStatus(),
                        item.getStatusAffectation(),
                        item.getAgenceId(),
                        item.getUserId(),
                        item.getDepartementId(),
                        item.getEntrepotId(),
                        item.getDateCreation()))
                .toList();

        return new DashboardSummaryDto(users, mobiles, sims, internetLines, materiels, buildHelpdeskSummary());
    }

    private DashboardSummaryDto.HelpdeskSummaryDto buildHelpdeskSummary() {
        Compte compte = getCurrentCompte();
        if (!isAdmin(compte) && !isManager(compte)) {
            return emptyHelpdeskSummary();
        }

        Users currentUser = requireCurrentUser(compte);
        if (currentUser == null) {
            return emptyHelpdeskSummary();
        }
        Integer managerAgenceId = isManager(compte) && currentUser.getAgence() != null
                ? currentUser.getAgence().getId()
                : null;

        List<TicketDashboardProjection> scopedTickets = ticketRepository.findAllDashboardSummaries().stream()
                .filter(ticket -> isAdmin(compte) || (managerAgenceId != null && Objects.equals(ticket.getSenderAgenceId(), managerAgenceId)))
                .toList();

        List<HistoriqueTicketDashboardProjection> scopedHistory = historiqueTicketRepository.findAllDashboardSummaries().stream()
                .filter(history -> isAdmin(compte) || (managerAgenceId != null && Objects.equals(history.getTicketSenderAgenceId(), managerAgenceId)))
                .toList();

        long totalTickets = scopedTickets.size();
        long newTickets = scopedTickets.stream()
                .filter(ticket -> "nouveau".equalsIgnoreCase(ticket.getStatus()))
                .count();
        long pendingTickets = scopedTickets.stream()
                .filter(ticket -> "en_attente".equalsIgnoreCase(ticket.getStatus()))
                .count();
        long inProgressTickets = scopedTickets.stream()
                .filter(ticket -> "en_progress".equalsIgnoreCase(ticket.getStatus()))
                .count();
        long resolvedTickets = scopedTickets.stream()
                .filter(ticket -> "resolu".equalsIgnoreCase(ticket.getStatus()))
                .count();
        long closedTickets = scopedTickets.stream()
                .filter(ticket -> "clos".equalsIgnoreCase(ticket.getStatus()))
                .count();
        long claimEvents = scopedHistory.stream()
                .filter(history -> "claim".equalsIgnoreCase(history.getStatusEvent()))
                .count();
        Integer currentUserId = currentUser.getId();
        long resolvedByCurrentUser = scopedTickets.stream()
                .filter(ticket -> {
                    String status = normalizeValue(ticket.getStatus());
                    return ("resolu".equals(status) || "clos".equals(status))
                            && Objects.equals(ticket.getApplierId(), currentUserId);
                })
                .count();

        List<DashboardSummaryDto.HelpdeskMetricDto> overviewBreakdown = List.of(
                buildMetric("nouveau", "Nouveaux", scopedTickets.stream().filter(ticket -> "nouveau".equalsIgnoreCase(ticket.getStatus())).count()),
                buildMetric("en_attente", "En attente", scopedTickets.stream().filter(ticket -> "en_attente".equalsIgnoreCase(ticket.getStatus())).count()),
                buildMetric("en_progress", "En cours", scopedTickets.stream().filter(ticket -> "en_progress".equalsIgnoreCase(ticket.getStatus())).count()),
                buildMetric("resolu", "Resolus", scopedTickets.stream().filter(ticket -> "resolu".equalsIgnoreCase(ticket.getStatus())).count()),
                buildMetric("clos", "Clos", scopedTickets.stream().filter(ticket -> "clos".equalsIgnoreCase(ticket.getStatus())).count()),
                buildMetric("claim", "Claim", claimEvents));

        List<DashboardSummaryDto.HelpdeskMetricDto> importanceBreakdown = List.of(
                buildMetric("low", "Low", scopedTickets.stream().filter(ticket -> "low".equalsIgnoreCase(ticket.getImportance())).count()),
                buildMetric("medium", "Medium", scopedTickets.stream().filter(ticket -> "medium".equalsIgnoreCase(ticket.getImportance())).count()),
                buildMetric("high", "High", scopedTickets.stream().filter(ticket -> "high".equalsIgnoreCase(ticket.getImportance())).count()));

        List<DashboardSummaryDto.HelpdeskMetricDto> impactBreakdown = List.of(
                buildMetric("low", "Low", scopedTickets.stream().filter(ticket -> "low".equalsIgnoreCase(ticket.getImpact())).count()),
                buildMetric("medium", "Medium", scopedTickets.stream().filter(ticket -> "medium".equalsIgnoreCase(ticket.getImpact())).count()),
                buildMetric("high", "High", scopedTickets.stream().filter(ticket -> "high".equalsIgnoreCase(ticket.getImpact())).count()));

        List<DashboardSummaryDto.HelpdeskTrendPointDto> trend = buildHelpdeskTrend(scopedTickets, scopedHistory);

        return new DashboardSummaryDto.HelpdeskSummaryDto(
                totalTickets,
                newTickets,
                pendingTickets,
                inProgressTickets,
                resolvedTickets,
                closedTickets,
                claimEvents,
                resolvedByCurrentUser,
                overviewBreakdown,
                importanceBreakdown,
                impactBreakdown,
                trend);
    }

    private DashboardSummaryDto.HelpdeskSummaryDto emptyHelpdeskSummary() {
        return new DashboardSummaryDto.HelpdeskSummaryDto(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                List.of(
                        buildMetric("nouveau", "Nouveaux", 0),
                        buildMetric("en_attente", "En attente", 0),
                        buildMetric("en_progress", "En cours", 0),
                        buildMetric("resolu", "Resolus", 0),
                        buildMetric("clos", "Clos", 0),
                        buildMetric("claim", "Claim", 0)),
                List.of(
                        buildMetric("low", "Low", 0),
                        buildMetric("medium", "Medium", 0),
                        buildMetric("high", "High", 0)),
                List.of(
                        buildMetric("low", "Low", 0),
                        buildMetric("medium", "Medium", 0),
                        buildMetric("high", "High", 0)),
                List.of());
    }

    private DashboardSummaryDto.HelpdeskMetricDto buildMetric(String key, String label, long value) {
        return new DashboardSummaryDto.HelpdeskMetricDto(key, label, value);
    }

    private String normalizeValue(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private List<DashboardSummaryDto.HelpdeskTrendPointDto> buildHelpdeskTrend(
            List<TicketDashboardProjection> scopedTickets,
            List<HistoriqueTicketDashboardProjection> scopedHistory) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(13);
        LinkedHashMap<LocalDate, TrendAccumulator> buckets = new LinkedHashMap<>();
        for (LocalDate cursor = start; !cursor.isAfter(end); cursor = cursor.plusDays(1)) {
            buckets.put(cursor, new TrendAccumulator());
        }

        for (TicketDashboardProjection ticket : scopedTickets) {
            if (ticket.getDateSent() == null) {
                continue;
            }
            LocalDate day = ticket.getDateSent().toLocalDate();
            TrendAccumulator bucket = buckets.get(day);
            if (bucket != null) {
                bucket.created++;
            }
        }

        for (HistoriqueTicketDashboardProjection history : scopedHistory) {
            if (history.getDateEvent() == null) {
                continue;
            }
            LocalDate day = history.getDateEvent().toLocalDate();
            TrendAccumulator bucket = buckets.get(day);
            if (bucket == null) {
                continue;
            }
            switch (normalizeValue(history.getStatusEvent())) {
                case "en_attente" -> bucket.enAttente++;
                case "en_progress" -> bucket.enProgress++;
                case "resolu" -> bucket.resolu++;
                case "clos" -> bucket.clos++;
                default -> {
                }
            }
        }

        return buckets.entrySet().stream()
                .map(entry -> new DashboardSummaryDto.HelpdeskTrendPointDto(
                        entry.getKey().toString(),
                        entry.getKey().format(DASHBOARD_DATE_LABEL),
                        entry.getValue().created,
                        entry.getValue().enAttente,
                        entry.getValue().enProgress,
                        entry.getValue().resolu,
                        entry.getValue().clos))
                .toList();
    }

    private Compte getCurrentCompte() {
        String login = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (login == null || login.isBlank()) {
            return null;
        }
        return compteRepository.findByLogin(login).orElse(null);
    }

    private Users requireCurrentUser(Compte compte) {
        if (compte == null || compte.getUser() == null || compte.getUser().getId() == null) {
            return null;
        }
        return usersRepository.findById(compte.getUser().getId()).orElse(null);
    }

    private boolean isAdmin(Compte compte) {
        return compte != null && compte.getCompteType() == Compte.CompteType.Administrateur;
    }

    private boolean isManager(Compte compte) {
        return compte != null && compte.getCompteType() == Compte.CompteType.Manager;
    }

    private static final class TrendAccumulator {
        private long created;
        private long enAttente;
        private long enProgress;
        private long resolu;
        private long clos;
    }
}
