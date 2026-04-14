package com.web.mdm.Services;

import com.web.mdm.Models.*;
import com.web.mdm.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class MobileService {

    @Autowired
    private MobileRepository repository;
    @Autowired
    private UsersRepository usersRepository;
    @Autowired
    private DepartementRepository departementRepository;
    @Autowired
    private AgenceRepository agenceRepository;
    @Autowired
    private EntrepotRepository entrepotRepository;
    @Autowired
    private HistoriqueMobileRepository historyRepository;
    @Autowired
    private CompteRepository compteRepository;
    @Autowired
    private MaterielSyncService syncService;
    @Autowired
    private ArchiveService archiveService;
    @Autowired
    private NotificationService notificationService;

    public List<Mobile> getAll() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Compte currentCompte = compteRepository.findByLogin(email).orElse(null);

        if (currentCompte != null && "Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
            Users managerProfile = currentCompte.getUser();
            if (managerProfile != null && managerProfile.getAgence() != null) {
                return repository.findByAgenceId(managerProfile.getAgence().getId());
            }
            if (managerProfile != null && managerProfile.getEntrepot() != null) {
                return repository.findByEntrepotId(managerProfile.getEntrepot().getId());
            }
        }
        return repository.findAllWithDetails();
    }

    public Optional<Mobile> getById(Integer id) {
        return repository.findById(id);
    }

    public Mobile save(Mobile mobile) {
        // --- CREATION ---
        if (mobile.getId() == null) {
            mobile.setDateCreation(LocalDate.now());
            mobile.setDateRecu(LocalDate.now());
            if (mobile.getStatusAffectation() == null)
                mobile.setStatusAffectation(Mobile.StatusAffectation.non_affecter);

            // Auto-assign Agence for Managers
            if (mobile.getAgence() == null && mobile.getEntrepot() == null) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                Compte currentCompte = compteRepository.findByLogin(email).orElse(null);
                if (currentCompte != null
                        && "Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
                    Users managerProfile = currentCompte.getUser();
                    if (managerProfile != null && managerProfile.getAgence() != null)
                        mobile.setAgence(managerProfile.getAgence());
                    if (managerProfile != null && managerProfile.getEntrepot() != null)
                        mobile.setEntrepot(managerProfile.getEntrepot());
                }
            }

            Mobile saved = repository.save(mobile);

            // 1. Specific History
            HistoriqueMobile history = new HistoriqueMobile();
            history.setMateriel(saved);
            history.setSN(saved.getSn());
            history.setNom(saved.getNom());
            history.setMarque(saved.getMarque());
            history.setModel(saved.getModel());
            history.setType(saved.getType() != null ? saved.getType().toString() : "N/A");
            history.setStatusEvent("CREATION");
            history.setDateEvent(LocalDate.now());
            history.setDateRecu(LocalDate.now());
            // Context for creation
            if (saved.getAgence() != null) {
                history.setAgence(saved.getAgence());
                history.setAgenceNom(saved.getAgence().getNom());
                if (saved.getAgence().getChefAgence() != null) {
                    history.setChefAgenceNom(saved.getAgence().getChefAgence().getNom() + " "
                            + saved.getAgence().getChefAgence().getPrenom());
                    history.setChefAgenceId(saved.getAgence().getChefAgence().getId());
                }
            }
            if (saved.getEntrepot() != null) {
                history.setEntrepot(saved.getEntrepot());
                if (saved.getEntrepot().getSiteRef() != null)
                    history.setEntrepotNom(saved.getEntrepot().getSiteRef().getLibeller());
            }
            historyRepository.save(history);

            // 2. Unified Sync
            syncService.syncInventory("Mobile", saved.getId(), saved.getSn(), null,
                    null, saved.getNom() + " " + saved.getModel(),
                    saved.getUser(), saved.getAgence(), saved.getEntrepot(), saved.getDepartement(),
                    saved.getStatus() != null ? saved.getStatus().toString() : "inactive",
                    saved.getStatusAffectation().toString(),
                    saved.getDateRecu(), saved.getDateEnvoie(), null, LocalDate.now());

            syncService.syncHistory("Mobile", saved.getId(), saved.getSn(), null, null,
                    saved.getNom() + " " + saved.getModel(), null, saved.getAgence(), saved.getEntrepot(),
                    saved.getDepartement(),
                    "CREATION", LocalDate.now());

            return saved;
        }

        // --- UPDATE ---
        Mobile saved = repository.save(mobile);

        syncService.syncInventory("Mobile", saved.getId(), saved.getSn(), null,
                null, saved.getNom() + " " + saved.getModel(),
                saved.getUser(), saved.getAgence(), saved.getEntrepot(), saved.getDepartement(),
                saved.getStatus() != null ? saved.getStatus().toString() : "inactive",
                saved.getStatusAffectation().toString(),
                saved.getDateRecu(), saved.getDateEnvoie(), saved.getDateAnnuler(), saved.getDateCreation());

        return saved;
    }

    public void delete(Integer id) {
        repository.findById(id).ifPresent(m -> archiveService.archiveRessource(m.getId(), m.getSn(), null, m.getNom()));
        repository.deleteById(id);
        syncService.deleteFromInventory("Mobile", id);
    }

    // --- ASSIGN TO USER ---
    @org.springframework.transaction.annotation.Transactional
    public void assignToUser(Integer mobileId, Integer userId, Integer agenceId, Integer entrepotId,
            Integer departementId) {
        // PRE-CHECK: Duplicate Assignment
        Users user = usersRepository.findById(userId).orElseThrow();
        if (repository.existsByUser(user)) {
            Mobile existing = repository.findAll().stream()
                    .filter(m -> m.getUser() != null && m.getUser().getId().equals(userId)).findFirst().orElse(null);
            if (existing != null && !existing.getId().equals(mobileId)) {
                throw new IllegalArgumentException(
                        "Cet utilisateur possède déjà un Mobile actif (" + existing.getNom() + ")");
            }
        }

        Mobile mobile = repository.findById(mobileId).orElseThrow();
        String event = (mobile.getUser() == null && mobile.getDepartement() == null) ? "AFFECTATION" : "REAFFECTATION";

        // Validate context (exactly one of agence/entrepot/departement if provided)
        int ctxCount = (agenceId != null ? 1 : 0) + (entrepotId != null ? 1 : 0) + (departementId != null ? 1 : 0);
        if (ctxCount > 1)
            throw new IllegalArgumentException("Only one of agenceId / entrepotId / departementId is allowed");

        // Validate user belongs to selected context
        if (agenceId != null) {
            if (user.getAgence() == null || !agenceId.equals(user.getAgence().getId())) {
                throw new IllegalArgumentException("User does not belong to selected agence");
            }
        } else if (entrepotId != null) {
            if (user.getEntrepot() == null || !entrepotId.equals(user.getEntrepot().getId())) {
                throw new IllegalArgumentException("User does not belong to selected entrepot");
            }
        } else if (departementId != null) {
            if (user.getDepartement() == null || !departementId.equals(user.getDepartement().getId())) {
                throw new IllegalArgumentException("User does not belong to selected departement");
            }
        }

        // Fetch ALL user context
        Agence userAgence = user.getAgence();
        Entrepot userEntrepot = user.getEntrepot();
        Departement userDepartement = user.getDepartement();

        // Specific History — enriched
        HistoriqueMobile history = new HistoriqueMobile();
        history.setMateriel(mobile);
        history.setSN(mobile.getSn());
        history.setNom(mobile.getNom());
        history.setMarque(mobile.getMarque());
        history.setModel(mobile.getModel());
        history.setUser(user);
        history.setUserNom(user.getNom());
        history.setUserPrenom(user.getPrenom());
        history.setUserCin(user.getCin());
        history.setUserAddress(user.getAddress());
        history.setUserTel(user.getTel());
        history.setUserStatus(user.getStatus() != null ? user.getStatus().toString() : "");
        if (user.getMatricule() != null)
            history.setUserMatricule(user.getMatricule());
        if (user.getFonctionRef() != null)
            history.setUserFonction(user.getFonctionRef().getNom());
        // Context
        history.setDepartement(userDepartement);
        if (userDepartement != null)
            history.setDepartmentNom(userDepartement.getNom());
        history.setEntrepot(userEntrepot);
        if (userEntrepot != null && userEntrepot.getSiteRef() != null)
            history.setEntrepotNom(userEntrepot.getSiteRef().getLibeller());
        history.setAgence(userAgence);
        if (userAgence != null) {
            history.setAgenceNom(userAgence.getNom());
            if (userAgence.getChefAgence() != null) {
                history.setChefAgenceNom(
                        userAgence.getChefAgence().getNom() + " " + userAgence.getChefAgence().getPrenom());
                history.setChefAgenceId(userAgence.getChefAgence().getId());
            }
        }
        history.setStatusEvent(event);
        history.setDateEvent(LocalDate.now());
        history.setDateEnvoie(LocalDate.now());
        historyRepository.save(history);

        // Update Mobile - Store ALL user IDs
        mobile.setUser(user);
        mobile.setAgence(userAgence);
        mobile.setEntrepot(userEntrepot);
        mobile.setDepartement(userDepartement);
        mobile.setStatus(Mobile.Status.active);
        mobile.setStatusAffectation(Mobile.StatusAffectation.affecter);
        mobile.setDateEnvoie(LocalDate.now());
        repository.save(mobile);

        // Unified Sync with all IDs
        syncService.syncInventory("Mobile", mobile.getId(), mobile.getSn(), null,
                null, mobile.getNom() + " " + mobile.getModel(), user, userAgence, userEntrepot, userDepartement,
                "active", "affecter", mobile.getDateRecu(), LocalDate.now(), null, mobile.getDateCreation());

        syncService.syncHistory("Mobile", mobile.getId(), mobile.getSn(), null, null,
                mobile.getNom() + " " + mobile.getModel(), user, userAgence, userEntrepot, userDepartement,
                event, LocalDate.now());

        notificationService.notifyAdminAssetAssignment("Mobile", mobile.getNom() + " " + mobile.getModel(),
                user.getId());
    }

    // --- ASSIGN TO DEPARTMENT (TSP / direct) ---
    public void assignToDepartement(Integer mobileId, Integer departementId) {
        Mobile mobile = repository.findById(mobileId).orElseThrow();
        Departement dept = departementRepository.findById(departementId).orElseThrow();
        String event = (mobile.getUser() == null && mobile.getDepartement() == null) ? "AFFECTATION" : "REAFFECTATION";

        // Specific History — enriched
        HistoriqueMobile history = new HistoriqueMobile();
        history.setMateriel(mobile);
        history.setSN(mobile.getSn());
        history.setDepartement(dept);
        history.setDepartmentNom(dept.getNom());
        history.setUserNom("SERVICE / DEPARTMENT");
        history.setStatusEvent(event);
        history.setDateEvent(LocalDate.now());
        history.setDateEnvoie(LocalDate.now());
        historyRepository.save(history);

        // Update Mobile
        mobile.setUser(null);
        mobile.setAgence(null);
        mobile.setEntrepot(null);
        mobile.setDepartement(dept);
        mobile.setStatus(Mobile.Status.active);
        mobile.setStatusAffectation(Mobile.StatusAffectation.affecter);
        mobile.setDateEnvoie(LocalDate.now());
        repository.save(mobile);

        // Unified Sync
        syncService.syncInventory("Mobile", mobile.getId(), mobile.getSn(), null,
                null, mobile.getNom() + " " + mobile.getModel(), null, null, null, dept,
                "active", "affecter", mobile.getDateRecu(), LocalDate.now(), null, mobile.getDateCreation());

        syncService.syncHistory("Mobile", mobile.getId(), mobile.getSn(), null, null,
                mobile.getNom() + " " + mobile.getModel(), null, null, null, dept,
                event, LocalDate.now());
    }

    @org.springframework.transaction.annotation.Transactional
    public void unassign(Integer mobileId) {
        Mobile mobile = repository.findById(mobileId).orElseThrow();
        Users user = mobile.getUser();
        Departement dept = mobile.getDepartement();
        Agence agence = mobile.getAgence();
        Entrepot entrepot = mobile.getEntrepot();

        if (user != null || dept != null) {
            HistoriqueMobile history = new HistoriqueMobile();
            history.setMateriel(mobile);
            history.setSN(mobile.getSn());
            history.setNom(mobile.getNom());

            if (user != null) {
                history.setUser(user);
                history.setUserNom(user.getNom());
                history.setUserPrenom(user.getPrenom());
                history.setAgence(agence);
                if (agence != null) {
                    history.setAgenceNom(agence.getNom());
                    if (agence.getChefAgence() != null) {
                        history.setChefAgenceNom(
                                agence.getChefAgence().getNom() + " " + agence.getChefAgence().getPrenom());
                        history.setChefAgenceId(agence.getChefAgence().getId());
                    }
                }
                history.setEntrepot(entrepot);
                if (entrepot != null && entrepot.getSiteRef() != null)
                    history.setEntrepotNom(entrepot.getSiteRef().getLibeller());
                history.setDepartement(mobile.getDepartement());
                if (mobile.getDepartement() != null)
                    history.setDepartmentNom(mobile.getDepartement().getNom());
            } else if (dept != null) {
                history.setDepartement(dept);
                history.setDepartmentNom(dept.getNom());
                history.setUserNom("SERVICE / DEPARTMENT");
            }

            history.setStatusEvent("DESAFFECTATION");
            history.setDateEvent(LocalDate.now());
            history.setDateRecu(LocalDate.now());
            historyRepository.save(history);

            // Unified History Log
            syncService.syncHistory("Mobile", mobile.getId(), mobile.getSn(), null, null,
                    mobile.getNom() + " " + mobile.getModel(), user, agence, entrepot, dept,
                    "DESAFFECTATION", LocalDate.now());

            notificationService.notifyAdminAssetUnassignment("Mobile", mobile.getNom() + " " + mobile.getModel(),
                    user.getId());
        }

        // Reset Mobile
        mobile.setUser(null);
        mobile.setAgence(null);
        mobile.setEntrepot(null);
        mobile.setDepartement(null);
        mobile.setStatus(Mobile.Status.inactive);
        mobile.setStatusAffectation(Mobile.StatusAffectation.non_affecter);
        repository.save(mobile);

        // Update Inventory
        syncService.syncInventory("Mobile", mobile.getId(), mobile.getSn(), null,
                null, mobile.getNom() + " " + mobile.getModel(), null, agence, entrepot, null,
                "inactive", "non_affecter", mobile.getDateRecu(), null, null, mobile.getDateCreation());
    }
}
