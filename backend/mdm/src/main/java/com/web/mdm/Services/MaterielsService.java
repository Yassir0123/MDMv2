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
public class MaterielsService {

    @Autowired
    private MaterielsRepository repository;
    @Autowired
    private HistoriqueMaterielsRepository historyRepository;
    @Autowired
    private UsersRepository usersRepository;
    @Autowired
    private CompteRepository compteRepository;
    @Autowired
    private MaterielSyncService syncService;
    @Autowired
    private ArchiveService archiveService;

    @Autowired
    private AgenceRepository agenceRepository;
    @Autowired
    private EntrepotRepository entrepotRepository;
    @Autowired
    private DepartementRepository departementRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private HistoryAdminStampService historyAdminStampService;

    public List<Materiels> getAll() {
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

    public Optional<Materiels> getById(Integer id) {
        return repository.findById(id);
    }

    public Materiels save(Materiels mat) {
        // --- CREATION ---
        if (mat.getId() == null) {
            mat.setDateCreation(LocalDate.now());
            mat.setDateRecu(LocalDate.now());
            if (mat.getStatusAffectation() == null)
                mat.setStatusAffectation("non_affecter");

            // Manager Auto-Assign
            if (mat.getAgence() == null && mat.getEntrepot() == null) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                Compte currentCompte = compteRepository.findByLogin(email).orElse(null);
                if (currentCompte != null
                        && "Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
                    Users managerProfile = currentCompte.getUser();
                    if (managerProfile != null && managerProfile.getAgence() != null)
                        mat.setAgence(managerProfile.getAgence());
                    if (managerProfile != null && managerProfile.getEntrepot() != null)
                        mat.setEntrepot(managerProfile.getEntrepot());
                }
            }

            Materiels saved = repository.save(mat);

            // 1. Specific History
            logSpecificHistory(saved, "CREATION", null, saved.getAgence(), saved.getEntrepot(), saved.getDepartement());

            // 2. Unified Sync
            syncUnified(saved, "CREATION", null, saved.getAgence(), saved.getEntrepot(), saved.getDepartement());

            return saved;
        }

        // --- UPDATE ---
        Materiels updated = repository.save(mat);
        syncUnified(updated, "UPDATE", updated.getUser(), updated.getAgence(), updated.getEntrepot(),
                updated.getDepartement());
        return updated;
    }

    // --- UNASSIGN (DESAFFECTATION) ---
    @org.springframework.transaction.annotation.Transactional
    public void unassign(Integer matId) {
        Materiels mat = repository.findById(matId).orElseThrow();

        // 1. Capture previous state for history
        Users oldUser = mat.getUser();
        Agence oldAgence = mat.getAgence();
        Entrepot oldEntrepot = mat.getEntrepot();
        Departement oldDept = mat.getDepartement();

        // 2. Log History BEFORE clearing
        if (oldUser != null || oldAgence != null || oldEntrepot != null || oldDept != null) {
            logSpecificHistory(mat, "DESAFFECTATION", oldUser, oldAgence, oldEntrepot, oldDept);

            // Unified Log
            syncService.syncHistory(mat.getTypeMateriel(), mat.getId(), mat.getSn(), null,
                    null, mat.getDesignation(), oldUser, oldAgence, oldEntrepot, oldDept, "DESAFFECTATION",
                    LocalDate.now());

            if (oldUser != null) {
                notificationService.notifyAdminAssetUnassignment(mat.getTypeMateriel(), mat.getDesignation(),
                        oldUser.getId());
            }
        }

        // 3. Clear ALL Associations
        mat.setUser(null);
        mat.setDepartement(null);
        mat.setAgence(null);
        mat.setEntrepot(null);

        mat.setStatus("Bon");
        mat.setStatusAffectation("non_affecter");

        repository.save(mat);

        // 4. Update Unified Inventory (Clear columns)
        syncService.syncInventory(mat.getTypeMateriel(), mat.getId(), mat.getSn(), null,
                null, mat.getDesignation() + " " + mat.getMarque(),
                null, null, null, null,
                "Bon", "non_affecter",
                mat.getDateRecu(), null, null, mat.getDateCreation());
    }

    public void delete(Integer id) {
        Materiels mat = repository.findById(id).orElse(null);
        if (mat != null) {
            archiveService.archiveRessource(mat.getId(), mat.getSn(), null, mat.getDesignation());
            syncService.deleteFromInventory(mat.getTypeMateriel(), id);
        }
        repository.deleteById(id);
    }

    // --- ASSIGNMENT ---
    @org.springframework.transaction.annotation.Transactional
    public void assign(Integer matId, Integer agenceId, Integer entrepotId, Integer deptId, Integer userId) {
        Materiels mat = repository.findById(matId).orElseThrow();

        // PRE-CHECK: Duplicate Assignment (Only for User Assignment)
        if (userId != null) {
            Users userPreview = usersRepository.findById(userId).orElseThrow();
            // Check if user already has this specific TYPE of material
            if (repository.existsByUserAndTypeMateriel(userPreview, mat.getTypeMateriel())) {
                Materiels existing = repository.findAll().stream()
                        .filter(m -> m.getUser() != null && m.getUser().getId().equals(userId)
                                && m.getTypeMateriel().equals(mat.getTypeMateriel()))
                        .findFirst().orElse(null);

                if (existing != null && !existing.getId().equals(matId)) {
                    throw new IllegalArgumentException("Cet utilisateur possède déjà un " + mat.getTypeMateriel()
                            + " actif (" + existing.getDesignation() + ")");
                }
            }
        }

        String event = (mat.getStatusAffectation().equals("non_affecter")) ? "AFFECTATION" : "REAFFECTATION";

        int ctxCount = (agenceId != null ? 1 : 0) + (entrepotId != null ? 1 : 0) + (deptId != null ? 1 : 0);
        if (userId == null && ctxCount != 1)
            throw new RuntimeException(
                    "Provide exactly one of agenceId / entrepotId / departementId when assigning without user");
        if (ctxCount > 1)
            throw new RuntimeException("Only one of agenceId / entrepotId / departementId is allowed");

        Users user = (userId != null) ? usersRepository.findById(userId).orElseThrow() : null;

        Agence agence = null;
        Entrepot entrepot = null;
        Departement dept = null;

        if (user != null) {
            // USER ASSIGNMENT: Always fetch ALL user IDs
            agence = user.getAgence();
            entrepot = user.getEntrepot();
            dept = user.getDepartement();

            // Validate user belongs to selected context (if context was specified)
            if (agenceId != null && (agence == null || !agenceId.equals(agence.getId()))) {
                throw new RuntimeException("User does not belong to selected agence");
            }
            if (entrepotId != null && (entrepot == null || !entrepotId.equals(entrepot.getId()))) {
                throw new RuntimeException("User does not belong to selected entrepot");
            }
            if (deptId != null && (dept == null || !deptId.equals(dept.getId()))) {
                throw new RuntimeException("User does not belong to selected departement");
            }
        } else {
            // DIRECT ENTITY ASSIGNMENT: Store only the specified entity
            if (agenceId != null)
                agence = agenceRepository.findById(agenceId).orElseThrow();
            if (entrepotId != null)
                entrepot = entrepotRepository.findById(entrepotId).orElseThrow();
            if (deptId != null)
                dept = departementRepository.findById(deptId).orElseThrow();
        }

        // 1. Log History with appropriate IDs
        logSpecificHistory(mat, event, user, agence, entrepot, dept);

        // 2. Update Entity
        mat.setUser(user);
        mat.setAgence(agence);
        mat.setEntrepot(entrepot);
        mat.setDepartement(dept);

        mat.setStatusAffectation("affecter");
        if (mat.getStatus() == null || mat.getStatus().isEmpty())
            mat.setStatus("Bon");

        mat.setDateEnvoie(LocalDate.now());
        repository.save(mat);

        // 3. Sync Unified
        syncUnified(mat, event, user, agence, entrepot, dept);

        if (user != null) {
            notificationService.notifyAdminAssetAssignment(mat.getTypeMateriel(), mat.getDesignation(), user.getId());
        }
    }

    // --- HELPERS ---
    private void logSpecificHistory(Materiels mat, String event, Users user, Agence agence, Entrepot entrepot,
            Departement dept) {
        HistoriqueMateriels h = new HistoriqueMateriels();
        h.setMateriels(mat);
        h.setSn(mat.getSn());
        h.setDesignation(mat.getDesignation());
        h.setTypeMateriel(mat.getTypeMateriel());
        h.setStatusEvent(event);
        h.setDateEvent(LocalDate.now());
        h.setDateRecu(mat.getDateRecu());
        h.setDateEnvoie(LocalDate.now());

        // User snapshot
        if (user != null) {
            h.setUser(user);
            h.setUserNom(user.getNom());
            h.setUserPrenom(user.getPrenom());
            h.setUserCin(user.getCin());
            h.setUserAddress(user.getAddress());
            h.setUserTel(user.getTel());
            h.setUserStatus(user.getStatus() != null ? user.getStatus().toString() : "");
            if (user.getMatricule() != null)
                h.setUserMatricule(user.getMatricule());
            if (user.getFonctionRef() != null)
                h.setUserFonction(user.getFonctionRef().getNom());
        } else {
            // Fallback label for non-user assignment
            String location = (dept != null) ? "Dépt: " + dept.getNom()
                    : (agence != null ? "Agence: " + agence.getNom()
                            : (entrepot != null ? "Entrepôt" : "Stock Global"));
            h.setUserNom(location);
        }

        // Context FKs + snapshots
        if (agence != null) {
            h.setAgence(agence);
            h.setAgenceNom(agence.getNom());
            if (agence.getChefAgence() != null) {
                h.setChefAgenceNom(agence.getChefAgence().getNom() + " " + agence.getChefAgence().getPrenom());
                h.setChefAgenceId(agence.getChefAgence().getId());
            }
        }
        if (entrepot != null) {
            h.setEntrepot(entrepot);
            if (entrepot.getSiteRef() != null)
                h.setEntrepotNom(entrepot.getSiteRef().getLibeller());
        }
        if (dept != null) {
            h.setDepartement(dept);
            h.setDepartementNom(dept.getNom());
        }

        historyRepository.save(historyAdminStampService.stamp(h));
    }

    private void syncUnified(Materiels mat, String event, Users user, Agence agence, Entrepot entrepot,
            Departement dept) {
        // Sync Inventory
        syncService.syncInventory(mat.getTypeMateriel(), mat.getId(), mat.getSn(), null,
                null, mat.getDesignation() + " " + mat.getMarque(),
                user, agence, entrepot, dept,
                mat.getStatus(), mat.getStatusAffectation(),
                mat.getDateRecu(), mat.getDateEnvoie(), mat.getDateAnnuler(), mat.getDateCreation());

        // Sync History (Only for events)
        if (!event.equals("UPDATE")) {
            syncService.syncHistory(mat.getTypeMateriel(), mat.getId(), mat.getSn(), null,
                    null, mat.getDesignation() + " " + mat.getMarque(),
                    user, agence, entrepot, dept, event, LocalDate.now());
        }
    }
}
