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
public class CarteSimService {

    @Autowired
    private CarteSimRepository repository;
    @Autowired
    private UsersRepository usersRepository;
    @Autowired
    private AgenceRepository agenceRepository;
    @Autowired
    private EntrepotRepository entrepotRepository;
    @Autowired
    private DepartementRepository departementRepository;
    @Autowired
    private HistoriqueCartesimRepository historyRepository;
    @Autowired
    private CompteRepository compteRepository;
    @Autowired
    private MaterielSyncService syncService;
    @Autowired
    private ArchiveService archiveService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private HistoryAdminStampService historyAdminStampService;

    public List<CarteSim> getAll() {
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

    public Optional<CarteSim> getById(Integer id) {
        return repository.findById(id);
    }

    public CarteSim save(CarteSim sim) {

        if (sim.getId() == null) {
            // --- CREATION LOGIC ---
            sim.setDateRecu(LocalDate.now());
            if (sim.getStatusAffectation() == null)
                sim.setStatusAffectation(CarteSim.StatusAffectation.non_affecter);

            // Auto-assign Agence for Managers
            if (sim.getAgence() == null && sim.getEntrepot() == null) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                Compte currentCompte = compteRepository.findByLogin(email).orElse(null);
                if (currentCompte != null
                        && "Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
                    Users managerProfile = currentCompte.getUser();
                    if (managerProfile != null && managerProfile.getAgence() != null)
                        sim.setAgence(managerProfile.getAgence());
                    if (managerProfile != null && managerProfile.getEntrepot() != null)
                        sim.setEntrepot(managerProfile.getEntrepot());
                }
            }
            CarteSim savedSim = repository.save(sim);

            // 1. History (Creation)
            HistoriqueCartesim history = new HistoriqueCartesim();
            fillHistoryBasicInfo(history, savedSim);

            // Fix: Capture Agence context on creation
            fillHistoryContext(history, savedSim.getAgence(), savedSim.getEntrepot(), savedSim.getDepartement());

            history.setStatusEvent("CREATION");
            history.setDateEvent(LocalDate.now());
            historyRepository.save(historyAdminStampService.stamp(history));

            // 2. Sync
            syncService.syncInventory("CarteSim", savedSim.getId(), savedSim.getSn(), savedSim.getNumero(),
                    savedSim.getOperateur(), "Carte SIM " + savedSim.getNumero(),
                    savedSim.getUser(), savedSim.getAgence(), savedSim.getEntrepot(), savedSim.getDepartement(),
                    savedSim.getStatus() != null ? savedSim.getStatus().toString() : "active",
                    savedSim.getStatusAffectation().toString(),
                    savedSim.getDateRecu(), savedSim.getDateEnvoie(), null, LocalDate.now());

            syncService.syncHistory("CarteSim", savedSim.getId(), savedSim.getSn(), savedSim.getNumero(),
                    savedSim.getOperateur(), "Carte SIM " + savedSim.getNumero(),
                    null, savedSim.getAgence(), savedSim.getEntrepot(), savedSim.getDepartement(), "CREATION",
                    LocalDate.now());

            return savedSim;
        }

        // --- UPDATE LOGIC ---
        CarteSim updated = repository.save(sim);
        syncService.syncInventory("CarteSim", updated.getId(), updated.getSn(), updated.getNumero(),
                updated.getOperateur(), "Carte SIM " + updated.getNumero(),
                updated.getUser(), updated.getAgence(), updated.getEntrepot(), updated.getDepartement(),
                updated.getStatus() != null ? updated.getStatus().toString() : "active",
                updated.getStatusAffectation().toString(),
                updated.getDateRecu(), updated.getDateEnvoie(), null, null);

        return updated;
    }

    @org.springframework.transaction.annotation.Transactional
    public void assignToUser(Integer simId, Integer userId, Integer agenceId, Integer entrepotId,
            Integer departementId) {
        // PRE-CHECK: Duplicate Assignment
        Users user = usersRepository.findById(userId).orElseThrow();
        // Check if user already has a SIM (excluding the current one if re-assigning to
        // self, though rare)
        if (repository.existsByUser(user)) {
            CarteSim existing = repository.findAll().stream()
                    .filter(s -> s.getUser() != null && s.getUser().getId().equals(userId)).findFirst().orElse(null);
            if (existing != null && !existing.getId().equals(simId)) {
                throw new IllegalArgumentException(
                        "Cet utilisateur possède déjà une Carte SIM active (" + existing.getNumero() + ")");
            }
        }

        CarteSim sim = repository.findById(simId).orElseThrow();
        String eventType = sim.getUser() == null ? "AFFECTATION" : "REAFFECTATION";

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

        // *** KEY CHANGE: Always fetch ALL user IDs regardless of assignment mode ***
        Agence userAgence = user.getAgence();
        Entrepot userEntrepot = user.getEntrepot();
        Departement userDepartement = user.getDepartement();

        // 1. History - Store all user context
        HistoriqueCartesim history = new HistoriqueCartesim();
        fillHistoryBasicInfo(history, sim);

        // Capture User Info
        history.setUser(user);
        history.setUserNom(user.getNom());
        history.setUserPrenom(user.getPrenom());
        history.setUserMatricule(user.getMatricule());
        history.setUserFonction(user.getFonctionRef() != null ? user.getFonctionRef().getNom() : null);
        history.setUserStatus(user.getStatus() != null ? user.getStatus().toString() : "Unknown");

        // Capture ALL context from user
        fillHistoryContext(history, userAgence, userEntrepot, userDepartement);

        history.setStatusEvent(eventType);
        history.setDateEvent(LocalDate.now());
        history.setDateEnvoie(LocalDate.now());
        historyRepository.save(historyAdminStampService.stamp(history));

        // 2. Update SIM - Store ALL user IDs
        sim.setUser(user);
        sim.setAgence(userAgence);
        sim.setEntrepot(userEntrepot);
        sim.setDepartement(userDepartement);
        sim.setStatus(CarteSim.Status.active);
        sim.setStatusAffectation(CarteSim.StatusAffectation.affecter);
        sim.setDateEnvoie(LocalDate.now());
        repository.save(sim);

        // 3. Sync with all IDs
        syncService.syncInventory("CarteSim", sim.getId(), sim.getSn(), sim.getNumero(),
                sim.getOperateur(), "Carte SIM " + sim.getNumero(),
                user, userAgence, userEntrepot, userDepartement,
                "active", "affecter", sim.getDateRecu(), LocalDate.now(), null, null);

        syncService.syncHistory("CarteSim", sim.getId(), sim.getSn(), sim.getNumero(),
                sim.getOperateur(), "Carte SIM " + sim.getNumero(),
                user, userAgence, userEntrepot, userDepartement, eventType, LocalDate.now());

        notificationService.notifyAdminAssetAssignment("Carte SIM", sim.getNumero(), user.getId());
    }

    @org.springframework.transaction.annotation.Transactional
    public void unassign(Integer simId) {
        CarteSim sim = repository.findById(simId).orElseThrow();
        Users user = sim.getUser();

        if (user != null) {
            HistoriqueCartesim history = new HistoriqueCartesim();
            fillHistoryBasicInfo(history, sim);

            // Capture User Snapshot before removing
            history.setUser(user);
            history.setUserNom(user.getNom());
            history.setUserPrenom(user.getPrenom());

            // Fix: Capture Context Snapshot before removing
            fillHistoryContext(history, sim.getAgence(), sim.getEntrepot(), sim.getDepartement());

            history.setStatusEvent("DESAFFECTATION");
            history.setDateEvent(LocalDate.now());
            history.setDateRecu(LocalDate.now());
            historyRepository.save(historyAdminStampService.stamp(history));

            syncService.syncHistory("CarteSim", sim.getId(), sim.getSn(), sim.getNumero(),
                    sim.getOperateur(), "Carte SIM " + sim.getNumero(),
                    user, sim.getAgence(), sim.getEntrepot(), sim.getDepartement(), "DESAFFECTATION", LocalDate.now());

            notificationService.notifyAdminAssetUnassignment("Carte SIM", sim.getNumero(), user.getId());
        }

        // --- UPDATE SIM STATE ---
        sim.setUser(null);
        sim.setAgence(null);
        ;
        sim.setEntrepot(null);
        sim.setDepartement(null);
        sim.setStatusAffectation(CarteSim.StatusAffectation.non_affecter);

        // FIX: We do NOT set status to inactive. We ensure it remains 'active'
        // (Available in Stock)
        sim.setStatus(CarteSim.Status.active);

        repository.save(sim);

        // Update Sync with correct status ("active")
        syncService.syncInventory("CarteSim", sim.getId(), sim.getSn(), sim.getNumero(),
                sim.getOperateur(), "Carte SIM " + sim.getNumero(),
                null, sim.getAgence(), sim.getEntrepot(), sim.getDepartement(),
                "active", "non_affecter", sim.getDateRecu(), null, null, null);
    }

    public void delete(Integer id) {
        CarteSim sim = repository.findById(id).orElse(null);
        if (sim != null) archiveService.archiveRessource(sim.getId(), sim.getSn(), sim.getOperateur(), null);
        repository.deleteById(id);
        syncService.deleteFromInventory("CarteSim", id);
    }

    // --- HELPERS ---

    private void fillHistoryBasicInfo(HistoriqueCartesim history, CarteSim sim) {
        history.setMateriel(sim);
        history.setSn(sim.getSn());
        history.setNumero(sim.getNumero());
        history.setOperateur(sim.getOperateur());
        history.setPin(sim.getPin());
        history.setPin2(sim.getPin2());
        history.setPuk(sim.getPuk());
        history.setPuk2(sim.getPuk2());
        history.setDateRecu(sim.getDateRecu());
    }

    private void fillHistoryContext(HistoriqueCartesim history, Agence agence, Entrepot entrepot,
            Departement departement) {
        if (agence != null) {
            history.setAgence(agence);
            history.setAgenceNom(agence.getNom());

            // *** FIX: Populate Chef Name AND Chef ID ***
            if (agence.getChefAgence() != null) {
                history.setChefAgenceNom(agence.getChefAgence().getNom() + " " + agence.getChefAgence().getPrenom());
                history.setChefAgenceId(agence.getChefAgence().getId()); // <--- THIS LINE WAS MISSING
            }
        }

        if (entrepot != null) {
            history.setEntrepot(entrepot);
            if (entrepot.getSiteRef() != null)
                history.setEntrepotNom(entrepot.getSiteRef().getLibeller());
        }

        if (departement != null) {
            history.setDepartement(departement);
            history.setDepartementNom(departement.getNom());
        }
    }
}
