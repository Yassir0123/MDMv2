package com.web.mdm.Services;

import com.web.mdm.Dto.LigneInternetDto;
import com.web.mdm.Models.*;
import com.web.mdm.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Objects;

@Service
public class LigneInternetService {

    @Autowired
    private LigneInternetRepository repository;
    @Autowired
    private AgenceRepository agenceRepository;
    @Autowired
    private EntrepotRepository entrepotRepository;
    @Autowired
    private DepartementRepository departementRepository;
    @Autowired
    private HistoriqueLigneinternetRepository historyRepository;
    @Autowired
    private CompteRepository compteRepository;
    @Autowired
    private MaterielSyncService syncService; // Unified Sync
    @Autowired
    private ArchiveService archiveService;
    @Autowired
    private HistoryAdminStampService historyAdminStampService;

    public List<LigneInternet> getAll() {
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

    public Optional<LigneInternet> getById(Integer id) {
        return repository.findById(id);
    }

    public LigneInternet save(LigneInternet line) {
        // --- CREATION ---
        if (line.getId() == null) {
            line.setDateCreation(LocalDate.now());
            line.setDateRecu(LocalDate.now());
            if (line.getStatus() == null)
                line.setStatus(LigneInternet.Status.active);
            if (line.getStatusAffectation() == null)
                line.setStatusAffectation(LigneInternet.StatusAffectation.non_affecter);

            // Auto-assign Agence for Managers
            if (line.getAgence() == null && line.getEntrepot() == null) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                Compte currentCompte = compteRepository.findByLogin(email).orElse(null);
                if (currentCompte != null
                        && "Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
                    Users managerProfile = currentCompte.getUser();
                    if (managerProfile != null && managerProfile.getAgence() != null)
                        line.setAgence(managerProfile.getAgence());
                    if (managerProfile != null && managerProfile.getEntrepot() != null)
                        line.setEntrepot(managerProfile.getEntrepot());
                }
            }

            LigneInternet saved = repository.save(line);

            // 1. Specific
            logSpecificHistory(saved, "CREATION", saved.getAgence(), saved.getEntrepot(), saved.getDepartement());

            // 2. Unified Sync
            syncService.syncInventory("LigneInternet", saved.getId(), saved.getSn(), null,
                    saved.getOperateur(), "Ligne " + saved.getOperateur() + " " + saved.getVitesse(),
                    null, saved.getAgence(), saved.getEntrepot(), saved.getDepartement(),
                    saved.getStatus().toString(), saved.getStatusAffectation().toString(),
                    saved.getDateRecu(), saved.getDateEnvoie(), saved.getDateAnnuler(), LocalDate.now());

            syncService.syncHistory("LigneInternet", saved.getId(), saved.getSn(), null,
                    saved.getOperateur(), "Ligne " + saved.getOperateur(), null, saved.getAgence(), saved.getEntrepot(),
                    saved.getDepartement(),
                    "CREATION", LocalDate.now());

            return saved;
        }
        return repository.save(line);
    }

    public LigneInternet update(Integer id, LigneInternetDto dto) {
        LigneInternet existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Line not found"));

        Integer oldAgenceId = existing.getAgence() != null ? existing.getAgence().getId() : null;
        Integer oldEntrepotId = existing.getEntrepot() != null ? existing.getEntrepot().getId() : null;
        Integer oldDeptId = existing.getDepartement() != null ? existing.getDepartement().getId() : null;

        existing.setSn(dto.getSn());
        existing.setOperateur(dto.getOperateur());
        existing.setVitesse(dto.getVitesse());
        try {
            existing.setStatus(LigneInternet.Status.valueOf(dto.getStatus()));
        } catch (Exception e) {
        }

        // Mutual exclusivity: exactly one target among agence/entrepot/departement (or
        // none)
        int targetCount = (dto.getAgenceId() != null ? 1 : 0) + (dto.getEntrepotId() != null ? 1 : 0)
                + (dto.getDepartementId() != null ? 1 : 0);
        if (targetCount > 1)
            throw new RuntimeException("Only one of agenceId / entrepotId / departementId is allowed");

        Agence newAgence = null;
        Entrepot newEntrepot = null;
        Departement newDept = null;
        if (dto.getAgenceId() != null)
            newAgence = agenceRepository.findById(dto.getAgenceId()).orElse(null);
        if (dto.getEntrepotId() != null)
            newEntrepot = entrepotRepository.findById(dto.getEntrepotId()).orElse(null);
        if (dto.getDepartementId() != null)
            newDept = departementRepository.findById(dto.getDepartementId()).orElse(null);

        existing.setAgence(newAgence);
        existing.setEntrepot(newEntrepot);
        existing.setDepartement(newDept);

        boolean agenceChanged = !Objects.equals(oldAgenceId, dto.getAgenceId());
        boolean entrepotChanged = !Objects.equals(oldEntrepotId, dto.getEntrepotId());
        boolean deptChanged = !Objects.equals(oldDeptId, dto.getDepartementId());

        if (agenceChanged || entrepotChanged || deptChanged) {
            existing.setStatusAffectation(LigneInternet.StatusAffectation.affecter);
            existing.setDateEnvoie(LocalDate.now());

            logSpecificHistory(existing, "REAFFECTATION", newAgence, newEntrepot, newDept);

            syncService.syncHistory("LigneInternet", existing.getId(), existing.getSn(), null,
                    existing.getOperateur(), "Ligne " + existing.getOperateur(), null, newAgence, newEntrepot, newDept,
                    "REAFFECTATION", LocalDate.now());
        }

        LigneInternet saved = repository.save(existing);

        // Always sync inventory on update
        syncService.syncInventory("LigneInternet", saved.getId(), saved.getSn(), null,
                saved.getOperateur(), "Ligne " + saved.getOperateur() + " " + saved.getVitesse(),
                null, saved.getAgence(), saved.getEntrepot(), saved.getDepartement(),
                saved.getStatus().toString(), saved.getStatusAffectation().toString(),
                saved.getDateRecu(), saved.getDateEnvoie(), saved.getDateAnnuler(), saved.getDateCreation());

        return saved;
    }

    public void resilier(Integer id) {
        LigneInternet line = repository.findById(id).orElseThrow();
        line.setStatus(LigneInternet.Status.resilier);
        line.setDateAnnuler(LocalDate.now());
        repository.save(line);

        logSpecificHistory(line, "RESILIATION", line.getAgence(), line.getEntrepot(), line.getDepartement());

        syncService.syncInventory("LigneInternet", line.getId(), line.getSn(), null,
                line.getOperateur(), "Ligne " + line.getOperateur(), null, line.getAgence(), line.getEntrepot(),
                line.getDepartement(),
                "resilier", line.getStatusAffectation().toString(),
                line.getDateRecu(), line.getDateEnvoie(), LocalDate.now(), line.getDateCreation());

        syncService.syncHistory("LigneInternet", line.getId(), line.getSn(), null,
                line.getOperateur(), "Ligne " + line.getOperateur(), null, line.getAgence(), line.getEntrepot(),
                line.getDepartement(),
                "RESILIATION", LocalDate.now());
    }

    public void activate(Integer id) {
        LigneInternet line = repository.findById(id).orElseThrow();
        line.setStatus(LigneInternet.Status.active);
        repository.save(line);

        logSpecificHistory(line, "ACTIVATION", line.getAgence(), line.getEntrepot(), line.getDepartement());

        syncService.syncInventory("LigneInternet", line.getId(), line.getSn(), null,
                line.getOperateur(), "Ligne " + line.getOperateur(), null, line.getAgence(), line.getEntrepot(),
                line.getDepartement(),
                "active", line.getStatusAffectation().toString(),
                line.getDateRecu(), line.getDateEnvoie(), null, line.getDateCreation());

        syncService.syncHistory("LigneInternet", line.getId(), line.getSn(), null,
                line.getOperateur(), "Ligne " + line.getOperateur(), null, line.getAgence(), line.getEntrepot(),
                line.getDepartement(),
                "ACTIVATION", LocalDate.now());
    }

    public void assign(Integer lineId, Integer agenceId, Integer entrepotId, Integer deptId) {
        LigneInternet line = repository.findById(lineId).orElseThrow();
        int targetCount = (agenceId != null ? 1 : 0) + (entrepotId != null ? 1 : 0) + (deptId != null ? 1 : 0);
        if (targetCount != 1)
            throw new RuntimeException("Provide exactly one of agenceId / entrepotId / departementId");

        Agence agence = (agenceId != null) ? agenceRepository.findById(agenceId).orElseThrow() : null;
        Entrepot entrepot = (entrepotId != null) ? entrepotRepository.findById(entrepotId).orElseThrow() : null;
        Departement dept = (deptId != null) ? departementRepository.findById(deptId).orElseThrow() : null;

        String eventType = (line.getAgence() == null && line.getEntrepot() == null && line.getDepartement() == null)
                ? "AFFECTATION"
                : "REAFFECTATION";
        logSpecificHistory(line, eventType, agence, entrepot, dept);

        line.setAgence(agence);
        line.setEntrepot(entrepot);
        line.setDepartement(dept);
        line.setStatusAffectation(LigneInternet.StatusAffectation.affecter);
        line.setDateEnvoie(LocalDate.now());
        repository.save(line);

        syncService.syncInventory("LigneInternet", line.getId(), line.getSn(), null,
                line.getOperateur(), "Ligne " + line.getOperateur() + " " + line.getVitesse(),
                null, agence, entrepot, dept,
                "active", "affecter",
                line.getDateRecu(), LocalDate.now(), null, line.getDateCreation());

        syncService.syncHistory("LigneInternet", line.getId(), line.getSn(), null,
                line.getOperateur(), "Ligne " + line.getOperateur(), null, agence, entrepot, dept,
                eventType, LocalDate.now());
    }

    public void delete(Integer id) {
        repository.findById(id)
                .ifPresent(l -> archiveService.archiveRessource(l.getId(), l.getSn(), l.getOperateur(), l.getNom()));
        repository.deleteById(id);
        syncService.deleteFromInventory("LigneInternet", id);
    }

    private void logSpecificHistory(LigneInternet line, String action, Agence agence, Entrepot entrepot,
            Departement dept) {
        HistoriqueLigneinternet history = new HistoriqueLigneinternet();
        history.setMateriel(line);
        history.setSN(line.getSn());
        history.setOperateur(line.getOperateur());
        history.setVitesse(line.getVitesse());
        history.setAgence(agence);
        history.setEntrepot(entrepot);
        history.setDepartement(dept);

        if (agence != null) {
            history.setAgenceNom(agence.getNom());
            if (agence.getChefAgence() != null) {
                history.setChefAgenceId(agence.getChefAgence().getId());
                history.setChefAgenceNom(agence.getChefAgence().getNom() + " " + agence.getChefAgence().getPrenom());
            }
        }
        if (entrepot != null && entrepot.getSiteRef() != null) {
            history.setEntrepotNom(entrepot.getSiteRef().getLibeller());
        }
        if (dept != null) {
            history.setDepartementNom(dept.getNom());
        }

        history.setStatusEvent(action);
        history.setDateEvent(LocalDate.now());
        history.setDateRecu(LocalDate.now());
        historyRepository.save(historyAdminStampService.stamp(history));
    }
}
