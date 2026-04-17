package com.web.mdm.Services;

import com.web.mdm.Dto.HelpdeskBootstrapDto;
import com.web.mdm.Dto.HelpdeskDeviceOptionDto;
import com.web.mdm.Dto.HelpdeskFileDto;
import com.web.mdm.Dto.HelpdeskMessageDto;
import com.web.mdm.Dto.HelpdeskTicketHistoryDto;
import com.web.mdm.Dto.HelpdeskTicketDetailDto;
import com.web.mdm.Dto.HelpdeskTicketSummaryDto;
import com.web.mdm.Dto.HelpdeskUserOptionDto;
import com.web.mdm.Dto.TicketAdminUpdateRequest;
import com.web.mdm.Dto.TicketCreateRequest;
import com.web.mdm.Dto.TicketReplyRequest;
import com.web.mdm.Models.Compte;
import com.web.mdm.Models.HistoriqueTicket;
import com.web.mdm.Models.Materiel;
import com.web.mdm.Models.Ticket;
import com.web.mdm.Models.TicketDevice;
import com.web.mdm.Models.TicketFile;
import com.web.mdm.Models.TicketMessage;
import com.web.mdm.Models.TicketObservant;
import com.web.mdm.Models.TicketTarget;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.HistoriqueTicketRepository;
import com.web.mdm.Repository.MaterielRepository;
import com.web.mdm.Repository.TicketDeviceRepository;
import com.web.mdm.Repository.TicketFileRepository;
import com.web.mdm.Repository.TicketMessageRepository;
import com.web.mdm.Repository.TicketObservantRepository;
import com.web.mdm.Repository.TicketRepository;
import com.web.mdm.Repository.TicketTargetRepository;
import com.web.mdm.Repository.UsersRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HelpdeskService {
    private static final Map<Integer, String> CATEGORY_BY_ID = Map.of(
            1, "hardware",
            2, "software",
            3, "account",
            4, "network");

    private final TicketRepository ticketRepository;
    private final TicketMessageRepository ticketMessageRepository;
    private final TicketFileRepository ticketFileRepository;
    private final TicketObservantRepository ticketObservantRepository;
    private final TicketTargetRepository ticketTargetRepository;
    private final TicketDeviceRepository ticketDeviceRepository;
    private final HistoriqueTicketRepository historiqueTicketRepository;
    private final HistoryAdminStampService historyAdminStampService;
    private final MaterielRepository materielRepository;
    private final UsersRepository usersRepository;
    private final CompteRepository compteRepository;
    private final NotificationService notificationService;
    private final Path storageRoot = Paths.get("uploads", "tickets").toAbsolutePath().normalize();

    public HelpdeskService(
            TicketRepository ticketRepository,
            TicketMessageRepository ticketMessageRepository,
            TicketFileRepository ticketFileRepository,
            TicketObservantRepository ticketObservantRepository,
            TicketTargetRepository ticketTargetRepository,
            TicketDeviceRepository ticketDeviceRepository,
            HistoriqueTicketRepository historiqueTicketRepository,
            HistoryAdminStampService historyAdminStampService,
            MaterielRepository materielRepository,
            UsersRepository usersRepository,
            CompteRepository compteRepository,
            NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.ticketMessageRepository = ticketMessageRepository;
        this.ticketFileRepository = ticketFileRepository;
        this.ticketObservantRepository = ticketObservantRepository;
        this.ticketTargetRepository = ticketTargetRepository;
        this.ticketDeviceRepository = ticketDeviceRepository;
        this.historiqueTicketRepository = historiqueTicketRepository;
        this.historyAdminStampService = historyAdminStampService;
        this.materielRepository = materielRepository;
        this.usersRepository = usersRepository;
        this.compteRepository = compteRepository;
        this.notificationService = notificationService;
    }

    public HelpdeskBootstrapDto getBootstrap() {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        boolean admin = isAdmin(compte);
        boolean manager = isManager(compte);
        Map<Integer, Compte> compteIndex = loadCompteIndex();

        HelpdeskBootstrapDto dto = new HelpdeskBootstrapDto();
        dto.setCanCreate(!admin);
        dto.setRole(compte.getCompteType().name());
        dto.setDefaultLocation(resolveLocation(currentUser));
        dto.setCurrentUser(toUserOption(currentUser));
        dto.setAllowedScopes(admin ? List.of("TARGETED") : List.of("ALL", "MYTICKETS", "TAGGED"));
        dto.setTargetOptions(findAdminUsers().stream()
                .map(user -> toBootstrapUserOption(user, compteIndex.get(user.getId())))
                .toList());

        if (manager) {
            LinkedHashSet<Users> options = new LinkedHashSet<>(findAdminUsers());
            options.addAll(findCollaborators(currentUser.getId()));
            dto.setObserverOptions(options.stream()
                    .filter(user -> !Objects.equals(user.getId(), currentUser.getId()))
                    .sorted(Comparator.comparing(this::fullName, String.CASE_INSENSITIVE_ORDER))
                    .map(user -> toBootstrapUserOption(user, compteIndex.get(user.getId())))
                    .toList());
        } else if (admin) {
            dto.setObserverOptions(usersRepository.findAll().stream()
                    .filter(user -> user != null && user.getId() != null)
                    .sorted(Comparator.comparing(this::fullName, String.CASE_INSENSITIVE_ORDER))
                    .map(user -> toBootstrapUserOption(user, compteIndex.get(user.getId())))
                    .toList());
        }

        dto.setMyDevices(loadDeviceOptions(List.of(currentUser.getId())));
        dto.setCollaboratorDevices(manager
                ? loadDeviceOptions(findCollaborators(currentUser.getId()).stream().map(Users::getId).toList())
                : List.of());
        return dto;
    }

    public List<HelpdeskTicketSummaryDto> listVisibleTickets() {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        Snapshot snapshot = buildSnapshot();
        boolean admin = isAdmin(compte);

        return findVisibleTickets(currentUser.getId(), admin).stream()
                .map(ticket -> toSummary(ticket, currentUser.getId(), admin, snapshot))
                .toList();
    }

    public HelpdeskTicketDetailDto getTicketDetail(Integer ticketId) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));

        Snapshot snapshot = buildSnapshot();
        boolean admin = isAdmin(compte);
        if (!canViewTicket(ticket, currentUser.getId(), admin, snapshot)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse");
        }

        return toDetail(ticket, currentUser.getId(), admin, snapshot);
    }

    public List<HelpdeskTicketHistoryDto> getTicketHistory(Integer ticketId) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));

        Snapshot snapshot = buildSnapshot();
        boolean admin = isAdmin(compte);
        if (!canViewTicket(ticket, currentUser.getId(), admin, snapshot)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse");
        }

        return historiqueTicketRepository.findByTicket_IdOrderByDateEventDescIdDesc(ticketId).stream()
                .map(this::toTicketHistoryDto)
                .toList();
    }

    @Transactional
    public HelpdeskTicketDetailDto claimTicket(Integer ticketId) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        if (!isAdmin(compte)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action reservee aux administrateurs");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));
        Snapshot snapshot = buildSnapshot();
        if (!snapshot.targets().getOrDefault(ticketId, Set.of()).contains(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce ticket ne vous est pas assigne");
        }
        ensureTicketIsMutable(ticket, "Ce ticket est deja resolu ou clos");

        Integer currentApplierId = resolveApplierId(ticket);
        if (currentApplierId != null) {
            if (Objects.equals(currentApplierId, currentUser.getId())) {
                return getTicketDetail(ticketId);
            }
            throw alreadyClaimed(ticket);
        }

        int updated = ticketRepository.claimTicketIfUnclaimed(ticketId, currentUser);
        if (updated == 0) {
            Ticket refreshed = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));
            if (refreshed.getApplier() != null && Objects.equals(refreshed.getApplier().getId(), currentUser.getId())) {
                return getTicketDetail(ticketId);
            }
            throw alreadyClaimed(refreshed);
        }

        Ticket claimedTicket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));
        recordTicketHistory(claimedTicket, currentUser, "CLAIM");
        return getTicketDetail(ticketId);
    }

    @Transactional
    public HelpdeskTicketDetailDto createTicket(TicketCreateRequest request, List<MultipartFile> files) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        if (isAdmin(compte)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Les administrateurs ne peuvent pas creer de ticket");
        }

        String subject = safeText(request.getSubject());
        String body = safeText(request.getBody());
        if (subject == null || body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sujet et message requis");
        }

        Ticket ticket = new Ticket();
        ticket.setStatus(Ticket.TicketStatus.nouveau);
        ticket.setSubject(subject);
        ticket.setDateSent(LocalDateTime.now());
        ticket.setSousCategoryId(normalizeCategoryId(request.getSousCategoryId()));
        ticket.setLocalisation(safeText(request.getLocalisation()) != null
                ? safeText(request.getLocalisation())
                : resolveLocation(currentUser));
        ticket.setType(parseType(request.getType()));
        ticket.setFlag(parseFlag(request.getFlag()));
        ticket.setSender(currentUser);
        ticket.setCloseDelay(7);
        ticket = ticketRepository.save(ticket);

        List<Materiel> selectedMateriels = resolveAllowedMateriels(compte, currentUser, request.getDeviceIds());
        saveDevices(ticket, selectedMateriels);
        saveObserversOnCreate(ticket, compte, currentUser, request.getObserverIds());
        List<Integer> adminIds = saveTargets(ticket, resolveAdministrateurTargetIds());
        saveMessage(ticket, currentUser, null, body, TicketMessage.MessageDeliveryStatus.sent);
        storeFiles(ticket, files);
        notifyTicketCreation(ticket, compte, currentUser, adminIds, selectedMateriels);
        recordTicketHistory(ticket, currentUser, ticket.getStatus().name());
        return getTicketDetail(ticket.getId());
    }

    @Transactional
    public HelpdeskTicketDetailDto replyToTicket(Integer ticketId, TicketReplyRequest request) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));
        String body = safeText(request.getBody());
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message est requis");
        }

        Snapshot snapshot = buildSnapshot();
        boolean admin = isAdmin(compte);
        if (!canViewTicket(ticket, currentUser.getId(), admin, snapshot)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse");
        }
        ensureTicketIsMutable(ticket, "Ce ticket est deja resolu ou clos");

        TicketMessage latest = snapshot.latestMessages().get(ticket.getId());
        Users receiver = latest != null ? latest.getSender() : ticket.getSender();

        if (admin) {
            if (!snapshot.targets().getOrDefault(ticketId, Set.of()).contains(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce ticket ne vous est pas assigne");
            }
            ensureAdminOwnsClaim(ticket, currentUser);
            saveMessage(ticket, currentUser, receiver, body, TicketMessage.MessageDeliveryStatus.pending);
            notifyAdminReply(ticket, currentUser);
        } else {
            if (!Objects.equals(ticket.getSender().getId(), currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le demandeur peut repondre");
            }
            if (!canRequesterReply(latest, currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas repondre pour le moment");
            }
            saveMessage(ticket, currentUser, receiver, body, TicketMessage.MessageDeliveryStatus.sent);
            notifyRequesterReply(ticket, compte, currentUser);
        }

        return getTicketDetail(ticketId);
    }

    @Transactional
    public HelpdeskTicketDetailDto updateAdminTicket(Integer ticketId, TicketAdminUpdateRequest request) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        if (!isAdmin(compte)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action reservee aux administrateurs");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket introuvable"));
        Snapshot snapshot = buildSnapshot();
        if (!snapshot.targets().getOrDefault(ticketId, Set.of()).contains(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce ticket ne vous est pas assigne");
        }
        ensureTicketIsMutable(ticket, "Ce ticket est deja resolu ou clos");
        ensureAdminOwnsClaim(ticket, currentUser);

        Ticket.TicketStatus requestedStatus = null;
        if (safeText(request.getStatus()) != null) {
            requestedStatus = parseStatus(request.getStatus());
            ticket.setStatus(requestedStatus);
        }
        ticket.setImportance(parseLevel(request.getImportance()));
        ticket.setImpact(parseLevel(request.getImpact()));
        ticketRepository.save(ticket);

        syncObservers(ticket, sanitizeUserIds(request.getObserverIds(), false, ticket.getSender().getId()));
        List<Integer> targetIds = sanitizeUserIds(request.getTargetIds(), true, null);
        if (targetIds.isEmpty()) {
            targetIds = List.of(currentUser.getId());
        }
        syncTargets(ticket, targetIds);
        if (requestedStatus == Ticket.TicketStatus.resolu) {
            notifyAdminResolution(ticket, currentUser);
        }
        recordTicketHistory(ticket, currentUser, requestedStatus != null ? requestedStatus.name() : ticket.getStatus().name());
        return getTicketDetail(ticketId);
    }

    public TicketFile getAccessibleFile(Integer fileId) {
        Compte compte = getCurrentCompte();
        Users currentUser = requireCurrentUser(compte);
        TicketFile file = ticketFileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable"));

        Snapshot snapshot = buildSnapshot();
        if (!canViewTicket(file.getTicket(), currentUser.getId(), isAdmin(compte), snapshot)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse");
        }
        return file;
    }

    public Resource loadFileAsResource(TicketFile file) {
        try {
            Path path = Paths.get(file.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier indisponible");
            }
            return resource;
        } catch (MalformedURLException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier invalide");
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoCloseResolvedTickets() {
        List<Ticket> resolved = ticketRepository.findByStatus(Ticket.TicketStatus.resolu);
        LocalDateTime now = LocalDateTime.now();
        for (Ticket ticket : resolved) {
            TicketMessage latest = ticketMessageRepository.findTopByTicket_IdOrderByPositionDesc(ticket.getId()).orElse(null);
            if (latest == null) {
                continue;
            }
            int delay = ticket.getCloseDelay() != null && ticket.getCloseDelay() > 0 ? ticket.getCloseDelay() : 7;
            if (latest.getLatestDate() != null && latest.getLatestDate().plusDays(delay).isBefore(now)) {
                ticket.setStatus(Ticket.TicketStatus.clos);
                ticketRepository.save(ticket);
                recordTicketHistory(ticket, null, Ticket.TicketStatus.clos.name());
            }
        }
    }

    private void recordTicketHistory(Ticket ticket, Users actor, String statusEvent) {
        if (ticket == null || ticket.getId() == null || statusEvent == null || statusEvent.isBlank()) {
            return;
        }

        HistoriqueTicket history = new HistoriqueTicket();
        history.setTicket(ticket);
        history.setSujet(ticket.getSubject());
        history.setCategorie(categoryLabel(ticket.getSousCategoryId()));
        history.setFlag(ticket.getFlag() != null ? ticket.getFlag().name() : null);
        history.setType(ticket.getType() != null ? ticket.getType().name() : null);
        history.setUser(actor);
        history.setManagerId(actor != null ? actor.getManagerId() : null);
        history.setDateEnvoie(ticket.getDateSent());
        history.setStatusEvent(statusEvent);
        history.setDateEvent(LocalDateTime.now());
        history.setApplier(resolveApplierUser(ticket));
        historiqueTicketRepository.save(historyAdminStampService.stamp(history));
    }

    private List<Materiel> resolveAllowedMateriels(Compte compte, Users currentUser, List<Integer> requestedIds) {
        List<Integer> ids = requestedIds == null ? List.of() : requestedIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return List.of();
        }

        Set<Integer> allowedUserIds = new HashSet<>();
        allowedUserIds.add(currentUser.getId());
        if (isManager(compte)) {
            allowedUserIds.addAll(findCollaborators(currentUser.getId()).stream().map(Users::getId).toList());
        }

        return materielRepository.findAllById(ids).stream()
                .filter(materiel -> materiel.getAffectedUser() != null && allowedUserIds.contains(materiel.getAffectedUser().getId()))
                .toList();
    }

    private void saveDevices(Ticket ticket, List<Materiel> materiels) {
        for (Materiel materiel : materiels) {
            TicketDevice device = new TicketDevice();
            device.setTicket(ticket);
            device.setMateriel(materiel);
            device.setUser(materiel.getAffectedUser());
            ticketDeviceRepository.save(device);
        }
    }

    private void saveObserversOnCreate(Ticket ticket, Compte compte, Users currentUser, List<Integer> requestedObserverIds) {
        if (isManager(compte)) {
            syncObservers(ticket, sanitizeUserIds(requestedObserverIds, false, currentUser.getId()));
            return;
        }
        if ((compte.getCompteType() == Compte.CompteType.Agent || compte.getCompteType() == Compte.CompteType.HR)
                && currentUser.getManagerId() != null) {
            syncObservers(ticket, List.of(currentUser.getManagerId()));
        }
    }

    private List<Integer> saveTargets(Ticket ticket, List<Integer> targetIds) {
        syncTargets(ticket, targetIds);
        return ticketTargetRepository.findByTicket_Id(ticket.getId()).stream()
                .map(TicketTarget::getTarget)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .distinct()
                .toList();
    }

    private TicketMessage saveMessage(
            Ticket ticket,
            Users sender,
            Users receiver,
            String body,
            TicketMessage.MessageDeliveryStatus statusSent) {
        TicketMessage message = new TicketMessage();
        message.setTicket(ticket);
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setBody(body);
        message.setPosition((int) ticketMessageRepository.countByTicket_Id(ticket.getId()) + 1);
        message.setStatusSent(statusSent);
        message.setReplied(0);
        message.setLatestDate(LocalDateTime.now());
        return ticketMessageRepository.save(message);
    }

    private void storeFiles(Ticket ticket, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }

        try {
            Files.createDirectories(storageRoot.resolve(String.valueOf(ticket.getId())));
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de creer le dossier de stockage");
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "piece-jointe.bin";
            String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path target = storageRoot.resolve(String.valueOf(ticket.getId()))
                    .resolve(UUID.randomUUID() + "_" + safeName);
            try {
                file.transferTo(target);
            } catch (IOException exception) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible d'enregistrer un fichier");
            }
            TicketFile ticketFile = new TicketFile();
            ticketFile.setTicket(ticket);
            ticketFile.setFilePath(target.toString());
            ticketFileRepository.save(ticketFile);
        }
    }

    private void syncObservers(Ticket ticket, List<Integer> newObserverIds) {
        List<TicketObservant> existing = ticketObservantRepository.findByTicket_Id(ticket.getId());
        Set<Integer> newIds = new LinkedHashSet<>(newObserverIds);
        for (TicketObservant item : existing) {
            if (item.getObservant() == null || !newIds.contains(item.getObservant().getId())) {
                ticketObservantRepository.delete(item);
            }
        }

        Set<Integer> existingIds = existing.stream()
                .map(TicketObservant::getObservant)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .collect(Collectors.toSet());

        for (Integer userId : newIds) {
            if (existingIds.contains(userId)) {
                continue;
            }
            Users user = usersRepository.findById(userId).orElse(null);
            if (user == null) {
                continue;
            }
            TicketObservant observant = new TicketObservant();
            observant.setTicket(ticket);
            observant.setObservant(user);
            ticketObservantRepository.save(observant);
        }
    }

    private void syncTargets(Ticket ticket, List<Integer> newTargetIds) {
        List<TicketTarget> existing = ticketTargetRepository.findByTicket_Id(ticket.getId());
        Set<Integer> newIds = new LinkedHashSet<>(newTargetIds);
        for (TicketTarget item : existing) {
            if (item.getTarget() == null || !newIds.contains(item.getTarget().getId())) {
                ticketTargetRepository.delete(item);
            }
        }

        Set<Integer> existingIds = existing.stream()
                .map(TicketTarget::getTarget)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .collect(Collectors.toSet());

        for (Integer userId : newIds) {
            if (existingIds.contains(userId)) {
                continue;
            }
            Users user = usersRepository.findById(userId).orElse(null);
            if (user == null) {
                continue;
            }
            TicketTarget target = new TicketTarget();
            target.setTicket(ticket);
            target.setTarget(user);
            ticketTargetRepository.save(target);
        }
    }

    private void notifyTicketCreation(Ticket ticket, Compte compte, Users sender, List<Integer> adminIds, List<Materiel> devices) {
        Set<Integer> targetUsers = new LinkedHashSet<>(loadObserverIds(ticket.getId()));
        if (compte.getCompteType() == Compte.CompteType.Agent || compte.getCompteType() == Compte.CompteType.HR) {
            targetUsers.remove(sender.getManagerId());
        } else if (compte.getCompteType() == Compte.CompteType.Manager) {
            targetUsers.addAll(devices.stream()
                    .map(Materiel::getAffectedUser)
                    .filter(Objects::nonNull)
                    .map(Users::getId)
                    .filter(id -> !Objects.equals(id, sender.getId()))
                    .toList());
        }

        notifyHelpdeskTargets(
                "Nouveau ticket #" + ticket.getId() + " - " + ticket.getSubject(),
                sender,
                adminIds,
                targetUsers);
    }

    private void notifyAdminReply(Ticket ticket, Users admin) {
        notifyHelpdeskFromAdmin(
                "Reponse helpdesk sur ticket #" + ticket.getId() + " - " + ticket.getSubject(),
                ticket,
                admin);
    }

    private void notifyAdminResolution(Ticket ticket, Users admin) {
        notifyHelpdeskFromAdmin(
                "Ticket resolu #" + ticket.getId() + " - " + ticket.getSubject(),
                ticket,
                admin);
    }

    private void notifyRequesterReply(Ticket ticket, Compte compte, Users requester) {
        Set<Integer> targetUsers = new LinkedHashSet<>(loadObserverIds(ticket.getId()));
        if (compte.getCompteType() == Compte.CompteType.Agent || compte.getCompteType() == Compte.CompteType.HR) {
            targetUsers.remove(requester.getManagerId());
        } else if (compte.getCompteType() == Compte.CompteType.Manager) {
            targetUsers.addAll(loadDeviceOwnerIds(ticket.getId()).stream()
                    .filter(id -> !Objects.equals(id, requester.getId()))
                    .toList());
        }

        notifyHelpdeskTargets(
                "Nouvelle reponse sur ticket #" + ticket.getId() + " - " + ticket.getSubject(),
                requester,
                loadTargetIds(ticket.getId()),
                targetUsers);
    }

    private void notifyHelpdeskTargets(
            String message,
            Users actor,
            Collection<Integer> targetIds,
            Collection<Integer> targetUserIds) {
        if (actor == null || targetIds == null || targetIds.isEmpty()) {
            return;
        }
        String eventKey = UUID.randomUUID().toString();
        Integer actorUserId = actor.getId();
        Integer managerId = actor.getManagerId();
        Set<Integer> uniqueTargets = targetIds.stream()
                .filter(Objects::nonNull)
                .filter(targetId -> !Objects.equals(targetId, actorUserId))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<Integer> uniqueTargetUsers = targetUserIds == null
                ? Set.of()
                : targetUserIds.stream()
                        .filter(Objects::nonNull)
                        .filter(targetUserId -> !Objects.equals(targetUserId, actorUserId))
                        .collect(Collectors.toCollection(LinkedHashSet::new));

        for (Integer targetId : uniqueTargets) {
            notificationService.createNotification(message, actorUserId, targetId, managerId, null, eventKey);
            for (Integer targetUserId : uniqueTargetUsers) {
                if (Objects.equals(targetUserId, targetId)) {
                    continue;
                }
                notificationService.createNotification(message, actorUserId, targetId, managerId, targetUserId, eventKey);
            }
        }
    }

    private void notifyHelpdeskFromAdmin(String message, Ticket ticket, Users admin) {
        if (ticket == null || ticket.getSender() == null || admin == null) {
            return;
        }
        Integer actorUserId = admin.getId();
        Integer targetId = ticket.getSender().getId();
        String eventKey = UUID.randomUUID().toString();
        notificationService.createNotification(
                message,
                actorUserId,
                targetId,
                ticket.getSender().getManagerId(),
                null,
                eventKey);

        loadObserverIds(ticket.getId()).stream()
                .filter(observerId -> !Objects.equals(observerId, actorUserId))
                .filter(observerId -> !Objects.equals(observerId, targetId))
                .forEach(observerId -> notificationService.createNotification(
                        message,
                        actorUserId,
                        targetId,
                        ticket.getSender().getManagerId(),
                        observerId,
                        eventKey));
    }

    private boolean canViewTicket(Ticket ticket, Integer currentUserId, boolean admin, Snapshot snapshot) {
        if (admin) {
            return ticketTargetRepository.existsByTicket_IdAndTarget_Id(ticket.getId(), currentUserId);
        }
        return Objects.equals(ticket.getSender().getId(), currentUserId)
                || ticketObservantRepository.existsByTicket_IdAndObservant_Id(ticket.getId(), currentUserId);
    }

    private HelpdeskTicketSummaryDto toSummary(Ticket ticket, Integer currentUserId, boolean admin, Snapshot snapshot) {
        HelpdeskTicketSummaryDto dto = new HelpdeskTicketSummaryDto();
        dto.setId(ticket.getId());
        dto.setStatus(ticket.getStatus().name());
        dto.setSubject(ticket.getSubject());
        dto.setImportance(ticket.getImportance() != null ? ticket.getImportance().name() : null);
        dto.setImpact(ticket.getImpact() != null ? ticket.getImpact().name() : null);
        dto.setFlag(ticket.getFlag() != null ? ticket.getFlag().name() : null);
        dto.setDateSent(ticket.getDateSent() != null ? ticket.getDateSent().toString() : null);
        dto.setSousCategoryId(ticket.getSousCategoryId());
        dto.setCategory(categoryLabel(ticket.getSousCategoryId()));
        dto.setLocalisation(ticket.getLocalisation());
        dto.setType(ticket.getType() != null ? ticket.getType().name() : null);
        dto.setSenderId(ticket.getSender() != null ? ticket.getSender().getId() : null);
        dto.setSenderName(ticket.getSender() != null ? fullName(ticket.getSender()) : null);
        Integer applierId = resolveApplierId(ticket);
        Users applierUser = resolveApplierUser(ticket);
        dto.setApplierId(applierId);
        dto.setApplierName(applierUser != null ? fullName(applierUser) : null);
        dto.setApplierMatricule(applierUser != null ? applierUser.getMatricule() : null);
        dto.setCloseDelay(ticket.getCloseDelay());
        dto.setObserverOnly(!admin && !Objects.equals(dto.getSenderId(), currentUserId));
        dto.setCanReply(!admin && Objects.equals(dto.getSenderId(), currentUserId)
                && !isLockedStatus(ticket.getStatus())
                && canRequesterReply(snapshot.latestMessages().get(ticket.getId()), currentUserId));
        dto.setCanClaim(admin && !isLockedStatus(ticket.getStatus()) && applierId == null);
        dto.setClaimedByCurrentUser(admin && applierId != null && Objects.equals(applierId, currentUserId));
        return dto;
    }

    private HelpdeskTicketDetailDto toDetail(Ticket ticket, Integer currentUserId, boolean admin, Snapshot snapshot) {
        HelpdeskTicketSummaryDto summary = toSummary(ticket, currentUserId, admin, snapshot);
        HelpdeskTicketDetailDto dto = new HelpdeskTicketDetailDto();
        dto.setId(summary.getId());
        dto.setStatus(summary.getStatus());
        dto.setSubject(summary.getSubject());
        dto.setImportance(summary.getImportance());
        dto.setImpact(summary.getImpact());
        dto.setFlag(summary.getFlag());
        dto.setDateSent(summary.getDateSent());
        dto.setSousCategoryId(summary.getSousCategoryId());
        dto.setCategory(summary.getCategory());
        dto.setLocalisation(summary.getLocalisation());
        dto.setType(summary.getType());
        dto.setSenderId(summary.getSenderId());
        dto.setSenderName(summary.getSenderName());
        dto.setApplierId(summary.getApplierId());
        dto.setApplierName(summary.getApplierName());
        dto.setApplierMatricule(summary.getApplierMatricule());
        dto.setCloseDelay(summary.getCloseDelay());
        dto.setObserverOnly(summary.isObserverOnly());
        dto.setCanReply(summary.isCanReply());
        dto.setCanClaim(summary.isCanClaim());
        dto.setClaimedByCurrentUser(summary.isClaimedByCurrentUser());
        dto.setViewerMode(admin ? "admin" : Objects.equals(ticket.getSender().getId(), currentUserId) ? "requester" : "observer");
        dto.setCanAdminManage(admin && !isLockedStatus(ticket.getStatus()));
        dto.setDemandeur(toUserOption(ticket.getSender()));
        dto.setObservers(ticketObservantRepository.findByTicket_Id(ticket.getId()).stream()
                .map(TicketObservant::getObservant)
                .filter(Objects::nonNull)
                .map(this::toUserOption)
                .toList());
        dto.setTargets(ticketTargetRepository.findByTicket_Id(ticket.getId()).stream()
                .map(TicketTarget::getTarget)
                .filter(Objects::nonNull)
                .map(this::toUserOption)
                .toList());
        dto.setDevices(ticketDeviceRepository.findByTicket_Id(ticket.getId()).stream().map(this::toDeviceOption).toList());
        dto.setMessages(ticketMessageRepository.findByTicket_IdOrderByPositionAsc(ticket.getId()).stream()
                .map(this::toMessageDto)
                .toList());
        dto.setFiles(ticketFileRepository.findByTicket_Id(ticket.getId()).stream().map(this::toFileDto).toList());
        dto.setBody(dto.getMessages().isEmpty() ? null : dto.getMessages().get(0).getBody());
        return dto;
    }

    private HelpdeskMessageDto toMessageDto(TicketMessage message) {
        HelpdeskMessageDto dto = new HelpdeskMessageDto();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender() != null ? message.getSender().getId() : null);
        dto.setSenderName(message.getSender() != null ? fullName(message.getSender()) : null);
        dto.setSenderRole(message.getSender() != null ? resolveRoleForUser(message.getSender().getId()) : null);
        dto.setReceiverId(message.getReceiver() != null ? message.getReceiver().getId() : null);
        dto.setPosition(message.getPosition());
        dto.setStatusSent(message.getStatusSent() != null ? message.getStatusSent().name() : null);
        dto.setReplied(message.getReplied());
        dto.setLatestDate(message.getLatestDate() != null ? message.getLatestDate().toString() : null);
        dto.setBody(message.getBody());
        return dto;
    }

    private HelpdeskFileDto toFileDto(TicketFile file) {
        HelpdeskFileDto dto = new HelpdeskFileDto();
        dto.setId(file.getId());
        dto.setFilePath(file.getFilePath());
        dto.setFileName(Paths.get(file.getFilePath()).getFileName().toString());
        return dto;
    }

    private HelpdeskTicketHistoryDto toTicketHistoryDto(HistoriqueTicket history) {
        HelpdeskTicketHistoryDto dto = new HelpdeskTicketHistoryDto();
        dto.setId(history.getId());
        dto.setTicketId(history.getTicket() != null ? history.getTicket().getId() : null);
        dto.setSujet(history.getSujet());
        dto.setCategorie(history.getCategorie());
        dto.setFlag(history.getFlag());
        dto.setType(history.getType());
        dto.setUserId(history.getUser() != null ? history.getUser().getId() : null);
        dto.setUserName(history.getUser() != null ? fullName(history.getUser()) : null);
        dto.setManagerId(history.getManagerId());
        dto.setDateEnvoie(history.getDateEnvoie() != null ? history.getDateEnvoie().toString() : null);
        dto.setStatusEvent(history.getStatusEvent());
        dto.setDateEvent(history.getDateEvent() != null ? history.getDateEvent().toString() : null);
        dto.setApplierId(history.getApplier() != null ? history.getApplier().getId() : null);
        dto.setApplierName(history.getApplier() != null ? fullName(history.getApplier()) : null);
        return dto;
    }

    private HelpdeskDeviceOptionDto toDeviceOption(TicketDevice device) {
        return toDeviceOption(device.getMateriel());
    }

    private HelpdeskDeviceOptionDto toDeviceOption(Materiel materiel) {
        HelpdeskDeviceOptionDto dto = new HelpdeskDeviceOptionDto();
        dto.setId(materiel.getId());
        dto.setUserId(materiel.getAffectedUser() != null ? materiel.getAffectedUser().getId() : null);
        dto.setUserName(materiel.getAffectedUser() != null ? fullName(materiel.getAffectedUser()) : null);
        dto.setMatricule(materiel.getAffectedUser() != null ? materiel.getAffectedUser().getMatricule() : null);
        dto.setSerialNumber(materiel.getSn() != null && !materiel.getSn().isBlank() ? materiel.getSn() : materiel.getNumero());
        dto.setDeviceName(materiel.getMaterielName());
        dto.setType(materiel.getTypeMateriel());
        dto.setLocation(resolveLocation(materiel.getAffectedUser()));
        return dto;
    }

    private HelpdeskUserOptionDto toUserOption(Users user) {
        HelpdeskUserOptionDto dto = new HelpdeskUserOptionDto();
        dto.setId(user.getId());
        dto.setName(fullName(user));
        dto.setLogin(compteRepository.findFirstByUser_Id(user.getId()).map(Compte::getLogin).orElse(null));
        dto.setRole(resolveRoleForUser(user.getId()));
        dto.setMatricule(user.getMatricule());
        dto.setLocation(resolveLocation(user));
        return dto;
    }

    private HelpdeskUserOptionDto toBootstrapUserOption(Users user, Compte compte) {
        HelpdeskUserOptionDto dto = new HelpdeskUserOptionDto();
        dto.setId(user.getId());
        dto.setName(fullName(user));
        dto.setLogin(compte != null ? compte.getLogin() : null);
        dto.setRole(compte != null && compte.getCompteType() != null ? compte.getCompteType().name() : "Agent");
        dto.setMatricule(user.getMatricule());
        return dto;
    }

    private List<HelpdeskDeviceOptionDto> loadDeviceOptions(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return materielRepository.findByAffectedUserIdIn(userIds).stream()
                .filter(materiel -> materiel.getAffectedUser() != null)
                .map(this::toDeviceOption)
                .sorted(Comparator.comparing(HelpdeskDeviceOptionDto::getDeviceName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private List<Users> findAdminUsers() {
        return compteRepository.findByCompteType(Compte.CompteType.Administrateur).stream()
                .map(Compte::getUser)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(this::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private List<Integer> resolveAdministrateurTargetIds() {
        return compteRepository.findByCompteType(Compte.CompteType.Administrateur).stream()
                .map(Compte::getUser)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .distinct()
                .toList();
    }

    private List<Ticket> findVisibleTickets(Integer currentUserId, boolean admin) {
        if (admin) {
            return ticketTargetRepository.findByTarget_IdOrderByTicket_DateSentDesc(currentUserId).stream()
                    .map(TicketTarget::getTicket)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        }

        LinkedHashSet<Ticket> visible = new LinkedHashSet<>(ticketRepository.findBySender_IdOrderByDateSentDesc(currentUserId));
        visible.addAll(ticketObservantRepository.findByObservant_IdOrderByTicket_DateSentDesc(currentUserId).stream()
                .map(TicketObservant::getTicket)
                .filter(Objects::nonNull)
                .toList());

        return visible.stream()
                .sorted(Comparator.comparing(Ticket::getDateSent, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .toList();
    }

    private List<Users> findCollaborators(Integer managerId) {
        return usersRepository.findByManagerId(managerId).stream()
                .filter(this::isOperationalUser)
                .toList();
    }

    private boolean isOperationalUser(Users user) {
        return user != null && user.getStatus() != null
                && user.getStatus() != Users.UserStatus.archived
                && user.getStatus() != Users.UserStatus.desactiver;
    }

    private String resolveLocation(Users user) {
        if (user == null) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        if (user.getAgence() != null && user.getAgence().getNom() != null && !user.getAgence().getNom().isBlank()) {
            parts.add(user.getAgence().getNom().trim());
        }
        if (user.getDepartement() != null && user.getDepartement().getNom() != null && !user.getDepartement().getNom().isBlank()) {
            parts.add(user.getDepartement().getNom().trim());
        }
        if (user.getEntrepot() != null && user.getEntrepot().getSiteRef() != null
                && user.getEntrepot().getSiteRef().getLibeller() != null
                && !user.getEntrepot().getSiteRef().getLibeller().isBlank()) {
            parts.add(user.getEntrepot().getSiteRef().getLibeller().trim());
        }
        if (parts.isEmpty() && user.getAddress() != null && !user.getAddress().isBlank()) {
            parts.add(user.getAddress().trim());
        }
        return parts.isEmpty() ? null : String.join(" / ", parts);
    }

    private String resolveRoleForUser(Integer userId) {
        return compteRepository.findFirstByUser_Id(userId)
                .map(Compte::getCompteType)
                .map(Enum::name)
                .orElse("Agent");
    }

    private String fullName(Users user) {
        String nom = user.getNom() != null ? user.getNom().trim() : "";
        String prenom = user.getPrenom() != null ? user.getPrenom().trim() : "";
        String fullName = (nom + " " + prenom).trim();
        return fullName.isBlank() ? "Utilisateur #" + user.getId() : fullName;
    }

    private boolean canRequesterReply(TicketMessage latest, Integer currentUserId) {
        return latest != null
                && latest.getSender() != null
                && !Objects.equals(latest.getSender().getId(), currentUserId)
                && "Administrateur".equalsIgnoreCase(resolveRoleForUser(latest.getSender().getId()))
                && latest.getStatusSent() == TicketMessage.MessageDeliveryStatus.pending
                && Objects.equals(latest.getReplied(), 0);
    }

    private void ensureTicketIsMutable(Ticket ticket, String message) {
        if (ticket != null && isLockedStatus(ticket.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void ensureAdminOwnsClaim(Ticket ticket, Users currentUser) {
        if (ticket == null || currentUser == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim invalide");
        }
        Integer applierId = resolveApplierId(ticket);
        if (applierId == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce ticket doit etre claim avant traitement");
        }
        if (!Objects.equals(applierId, currentUser.getId())) {
            throw alreadyClaimed(ticket);
        }
    }

    private boolean isLockedStatus(Ticket.TicketStatus status) {
        return status == Ticket.TicketStatus.resolu || status == Ticket.TicketStatus.clos;
    }

    private ResponseStatusException alreadyClaimed(Ticket ticket) {
        Users applier = resolveApplierUser(ticket);
        String claimedBy = applier != null ? fullName(applier) : "un autre administrateur";
        return new ResponseStatusException(HttpStatus.CONFLICT, "Ce ticket est deja pris en charge par " + claimedBy);
    }

    private Integer resolveApplierId(Ticket ticket) {
        if (ticket == null) {
            return null;
        }
        if (ticket.getApplier() != null && ticket.getApplier().getId() != null) {
            return ticket.getApplier().getId();
        }
        if (ticket.getApplierIdValue() != null) {
            return ticket.getApplierIdValue();
        }
        return ticket.getId() != null ? ticketRepository.findApplierIdValueById(ticket.getId()) : null;
    }

    private Users resolveApplierUser(Ticket ticket) {
        if (ticket == null) {
            return null;
        }
        if (ticket.getApplier() != null) {
            return ticket.getApplier();
        }
        Integer applierId = resolveApplierId(ticket);
        if (applierId == null) {
            return null;
        }
        return usersRepository.findById(applierId).orElse(null);
    }

    private List<Integer> loadObserverIds(Integer ticketId) {
        return ticketObservantRepository.findByTicket_Id(ticketId).stream()
                .map(TicketObservant::getObservant)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .distinct()
                .toList();
    }

    private List<Integer> loadTargetIds(Integer ticketId) {
        return ticketTargetRepository.findByTicket_Id(ticketId).stream()
                .map(TicketTarget::getTarget)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .distinct()
                .toList();
    }

    private List<Integer> loadDeviceOwnerIds(Integer ticketId) {
        return ticketDeviceRepository.findByTicket_Id(ticketId).stream()
                .map(TicketDevice::getUser)
                .filter(Objects::nonNull)
                .map(Users::getId)
                .distinct()
                .toList();
    }

    private Map<Integer, Compte> loadCompteIndex() {
        return compteRepository.findAll().stream()
                .filter(compte -> compte.getUser() != null && compte.getUser().getId() != null)
                .collect(Collectors.toMap(
                        compte -> compte.getUser().getId(),
                        compte -> compte,
                        (first, second) -> first));
    }

    private Snapshot buildSnapshot() {
        Map<Integer, Set<Integer>> observers = new HashMap<>();
        for (TicketObservant observant : ticketObservantRepository.findAll()) {
            if (observant.getTicket() == null || observant.getObservant() == null) {
                continue;
            }
            observers.computeIfAbsent(observant.getTicket().getId(), ignored -> new HashSet<>())
                    .add(observant.getObservant().getId());
        }

        Map<Integer, Set<Integer>> targets = new HashMap<>();
        for (TicketTarget target : ticketTargetRepository.findAll()) {
            if (target.getTicket() == null || target.getTarget() == null) {
                continue;
            }
            targets.computeIfAbsent(target.getTicket().getId(), ignored -> new HashSet<>())
                    .add(target.getTarget().getId());
        }

        Map<Integer, TicketMessage> latestMessages = new HashMap<>();
        for (TicketMessage message : ticketMessageRepository.findAll()) {
            if (message.getTicket() == null) {
                continue;
            }
            latestMessages.compute(message.getTicket().getId(), (ticketId, existing) -> {
                if (existing == null) {
                    return message;
                }
                return message.getPosition() > existing.getPosition() ? message : existing;
            });
        }

        return new Snapshot(observers, targets, latestMessages);
    }

    private Integer normalizeCategoryId(Integer categoryId) {
        if (categoryId == null || !CATEGORY_BY_ID.containsKey(categoryId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categorie invalide");
        }
        return categoryId;
    }

    private String categoryLabel(Integer categoryId) {
        return categoryId != null ? CATEGORY_BY_ID.get(categoryId) : null;
    }

    private Ticket.TicketType parseType(String value) {
        try {
            return Ticket.TicketType.valueOf(safeText(value));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type de ticket invalide");
        }
    }

    private Ticket.TicketFlag parseFlag(String value) {
        try {
            return value == null || value.isBlank() ? Ticket.TicketFlag.NONE : Ticket.TicketFlag.valueOf(value.trim());
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flag invalide");
        }
    }

    private Ticket.TicketStatus parseStatus(String value) {
        try {
            return Ticket.TicketStatus.valueOf(value.trim());
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide");
        }
    }

    private Ticket.TicketLevel parseLevel(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Ticket.TicketLevel.valueOf(value.trim());
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valeur de niveau invalide");
        }
    }

    private List<Integer> sanitizeUserIds(List<Integer> ids, boolean adminOnly, Integer excludedUserId) {
        List<Integer> source = ids == null ? List.of() : ids;
        return source.stream()
                .filter(Objects::nonNull)
                .distinct()
                .filter(id -> !Objects.equals(id, excludedUserId))
                .filter(id -> usersRepository.findById(id).isPresent())
                .filter(id -> !adminOnly || "Administrateur".equalsIgnoreCase(resolveRoleForUser(id)))
                .toList();
    }

    private String safeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Compte getCurrentCompte() {
        String login = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (login == null || login.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie");
        }
        return compteRepository.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Compte introuvable"));
    }

    private Users requireCurrentUser(Compte compte) {
        if (compte.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable");
        }
        return usersRepository.findById(compte.getUser().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));
    }

    private boolean isAdmin(Compte compte) {
        return compte.getCompteType() == Compte.CompteType.Administrateur;
    }

    private boolean isManager(Compte compte) {
        return compte.getCompteType() == Compte.CompteType.Manager;
    }

    private record Snapshot(
            Map<Integer, Set<Integer>> observers,
            Map<Integer, Set<Integer>> targets,
            Map<Integer, TicketMessage> latestMessages) {
    }
}
