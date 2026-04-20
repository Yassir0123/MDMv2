package com.web.mdm.Services;

import com.web.mdm.Models.*;
import com.web.mdm.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class UserMaterielService {

    @Autowired
    private MaterielRepository materielRepository;

    // Specific Repositories
    @Autowired
    private MobileRepository mobileRepository;
    @Autowired
    private CarteSimRepository carteSimRepository;
    @Autowired
    private LigneInternetRepository ligneInternetRepository;
    @Autowired
    private MaterielsRepository materielsRepository; // IT Equipment

    // Sync Service
    @Autowired
    private MaterielSyncService syncService;

    // Specific History Repositories
    @Autowired
    private HistoriqueMobileRepository histMobileRepo;
    @Autowired
    private HistoriqueCartesimRepository histSimRepo;
    @Autowired
    private HistoriqueLigneinternetRepository histInternetRepo;
    @Autowired
    private HistoriqueMaterielsRepository histMaterielsRepo;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private HistoryAdminStampService historyAdminStampService;

    // --- 1. CONFIRM RECEPTION (ACCUSER) ---
    public void confirmReception(Integer materielId) {
        Materiel mat = materielRepository.findById(materielId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        LocalDateTime now = LocalDateTime.now();
        String type = mat.getTypeMateriel();
        Integer specificId = mat.getSpecificId();

        // Update Specific Tables & Create Specific History
        switch (type) {
            case "Mobile":
                Mobile m = mobileRepository.findById(specificId).orElseThrow();
                m.setStatusAffectation(Mobile.StatusAffectation.recu);
                m.setDateRecu(now);
                mobileRepository.save(m);

                // Specific History
                HistoriqueMobile hm = new HistoriqueMobile();
                hm.setMateriel(m);
                hm.setSN(m.getSn());
                hm.setNom(m.getNom());
                hm.setMarque(m.getMarque());
                hm.setModel(m.getModel());
                hm.setUser(m.getUser());
                if (m.getUser() != null) {
                    hm.setUserNom(m.getUser().getNom());
                    hm.setUserPrenom(m.getUser().getPrenom());
                }
                hm.setStatusEvent("RECEPTION"); // <--- Specific Event
                hm.setDateEvent(now);
                hm.setDateRecu(now);
                histMobileRepo.save(historyAdminStampService.stamp(hm));
                break;

            case "CarteSim":
                CarteSim s = carteSimRepository.findById(specificId).orElseThrow();
                s.setStatusAffectation(CarteSim.StatusAffectation.recu);
                s.setDateRecu(now);
                carteSimRepository.save(s);

                // Specific History
                HistoriqueCartesim hs = new HistoriqueCartesim();
                hs.setMateriel(s);
                hs.setSn(s.getSn());
                hs.setNumero(s.getNumero());
                hs.setOperateur(s.getOperateur());
                hs.setUser(s.getUser());
                if (s.getUser() != null) {
                    hs.setUserNom(s.getUser().getNom());
                    hs.setUserPrenom(s.getUser().getPrenom());
                }
                hs.setStatusEvent("RECEPTION");
                hs.setDateEvent(now);
                hs.setDateRecu(now);
                histSimRepo.save(historyAdminStampService.stamp(hs));
                break;

            case "LigneInternet":
                LigneInternet l = ligneInternetRepository.findById(specificId).orElseThrow();
                l.setStatusAffectation(LigneInternet.StatusAffectation.recu);
                l.setDateRecu(now);
                ligneInternetRepository.save(l);

                // Specific History
                HistoriqueLigneinternet hl = new HistoriqueLigneinternet();
                hl.setMateriel(l);
                hl.setSN(l.getSn());
                hl.setOperateur(l.getOperateur());
                hl.setVitesse(l.getVitesse());
                hl.setAgence(l.getAgence());
                hl.setDepartement(l.getDepartement());
                hl.setStatusEvent("RECEPTION");
                hl.setDateEvent(now);
                hl.setDateRecu(now);
                histInternetRepo.save(historyAdminStampService.stamp(hl));
                break;

            default: // Materiels (IT)
                Materiels it = materielsRepository.findById(specificId).orElseThrow();
                it.setStatusAffectation("recu");
                it.setDateRecu(now);
                materielsRepository.save(it);

                // Specific History
                HistoriqueMateriels hit = new HistoriqueMateriels();
                hit.setMateriels(it);
                hit.setUser(it.getUser());
                if (it.getUser() != null) {
                    hit.setUserNom(it.getUser().getNom());
                    hit.setUserPrenom(it.getUser().getPrenom());
                }
                hit.setStatusEvent("RECEPTION");
                hit.setDateEvent(now);
                hit.setDateRecu(now);
                histMaterielsRepo.save(historyAdminStampService.stamp(hit));
                break;
        }

        // Update Unified Table
        mat.setStatusAffectation("recu");
        mat.setDateRecu(now);
        materielRepository.save(mat);

        // Update Unified History
        syncService.syncHistory(type, specificId, mat.getSn(), mat.getNumero(), mat.getOperateur(),
                mat.getMaterielName(), mat.getAffectedUser(), mat.getAgence(), mat.getEntrepot(), mat.getDepartement(),
                "RECEPTION", now);

        Integer actorUserId = notificationService.getCurrentActorUserId();
        Integer actedUserId = mat.getAffectedUser() != null ? mat.getAffectedUser().getId() : null;
        Integer targetUserId = actedUserId != null && !actedUserId.equals(actorUserId) ? actedUserId : null;
        notificationService.notifyReceptionOrSignalementToAdmin("Reception", type, mat.getMaterielName(),
                actedUserId, targetUserId);
    }

    // --- 2. REPORT ISSUE (SIGNALER / ANNULER) ---
    public void reportIssue(Integer materielId, String motif, String commentaire) {
        Materiel mat = materielRepository.findById(materielId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        LocalDateTime now = LocalDateTime.now();
        String type = mat.getTypeMateriel();
        Integer specificId = mat.getSpecificId();

        // Update Specific Tables & Create Specific History
        switch (type) {
            case "Mobile":
                Mobile m = mobileRepository.findById(specificId).orElseThrow();
                m.setStatusAffectation(Mobile.StatusAffectation.annuler);
                m.setDateAnnuler(now);
                mobileRepository.save(m);

                HistoriqueMobile hm = new HistoriqueMobile();
                hm.setMateriel(m);
                hm.setSN(m.getSn());
                hm.setNom(m.getNom());
                hm.setMarque(m.getMarque());
                hm.setModel(m.getModel());
                hm.setUser(m.getUser());
                if (m.getUser() != null) {
                    hm.setUserNom(m.getUser().getNom());
                    hm.setUserPrenom(m.getUser().getPrenom());
                }
                hm.setStatusEvent("ANNULATION"); // <--- Specific Event
                hm.setDateEvent(now);
                hm.setDateAnnuler(now);
                hm.setMotif(motif);
                hm.setCommentaire(commentaire);
                histMobileRepo.save(historyAdminStampService.stamp(hm));
                break;

            case "CarteSim":
                CarteSim s = carteSimRepository.findById(specificId).orElseThrow();
                s.setStatusAffectation(CarteSim.StatusAffectation.annuler);
                s.setDateAnnuler(now);
                carteSimRepository.save(s);

                HistoriqueCartesim hs = new HistoriqueCartesim();
                hs.setMateriel(s);
                hs.setSn(s.getSn());
                hs.setNumero(s.getNumero());
                hs.setOperateur(s.getOperateur());
                hs.setUser(s.getUser());
                if (s.getUser() != null) {
                    hs.setUserNom(s.getUser().getNom());
                    hs.setUserPrenom(s.getUser().getPrenom());
                }
                hs.setStatusEvent("ANNULATION");
                hs.setDateEvent(now);
                hs.setDateAnnuler(now);
                hs.setMotif(motif);
                hs.setCommentaire(commentaire);
                histSimRepo.save(historyAdminStampService.stamp(hs));
                break;

            case "LigneInternet":
                LigneInternet l = ligneInternetRepository.findById(specificId).orElseThrow();
                l.setStatusAffectation(LigneInternet.StatusAffectation.annuler);
                l.setDateAnnuler(now);
                ligneInternetRepository.save(l);

                HistoriqueLigneinternet hl = new HistoriqueLigneinternet();
                hl.setMateriel(l);
                hl.setSN(l.getSn());
                hl.setOperateur(l.getOperateur());
                hl.setVitesse(l.getVitesse());
                hl.setAgence(l.getAgence());
                hl.setEntrepot(l.getEntrepot());
                hl.setDepartement(l.getDepartement());
                hl.setStatusEvent("ANNULATION");
                hl.setDateEvent(now);
                hl.setDateAnnuler(now);
                hl.setMotif(motif);
                hl.setCommentaire(commentaire);
                histInternetRepo.save(historyAdminStampService.stamp(hl));
                break;

            default: // Materiels
                Materiels it = materielsRepository.findById(specificId).orElseThrow();
                it.setStatusAffectation("annuler");
                it.setDateAnnuler(now);
                materielsRepository.save(it);

                HistoriqueMateriels hit = new HistoriqueMateriels();
                hit.setMateriels(it);
                hit.setUser(it.getUser());
                if (it.getUser() != null) {
                    hit.setUserNom(it.getUser().getNom());
                    hit.setUserPrenom(it.getUser().getPrenom());
                }
                hit.setStatusEvent("ANNULATION");
                hit.setDateEvent(now);
                hit.setDateAnnuler(now);
                hit.setMotif(motif);
                hit.setCommentaire(commentaire);
                histMaterielsRepo.save(historyAdminStampService.stamp(hit));
                break;
        }

        // Update Unified Table
        mat.setStatusAffectation("annuler");
        mat.setDateAnnuler(now);
        materielRepository.save(mat);

        // Update Unified History
        syncService.syncHistory(type, specificId, mat.getSn(), mat.getNumero(), mat.getOperateur(),
                mat.getMaterielName(), mat.getAffectedUser(), mat.getAgence(), mat.getEntrepot(), mat.getDepartement(),
                "ANNULATION", now);

        Integer actorUserId = notificationService.getCurrentActorUserId();
        Integer actedUserId = mat.getAffectedUser() != null ? mat.getAffectedUser().getId() : null;
        Integer targetUserId = actedUserId != null && !actedUserId.equals(actorUserId) ? actedUserId : null;
        notificationService.notifyReceptionOrSignalementToAdmin("Signalement", type, mat.getMaterielName(),
                actedUserId, targetUserId);
    }

    public void retryAssignment(Integer materielId) {
        Materiel mat = materielRepository.findById(materielId).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        String type = mat.getTypeMateriel();
        Integer specificId = mat.getSpecificId();

        switch (type) {
            case "Mobile":
                Mobile m = mobileRepository.findById(specificId).orElseThrow();
                m.setStatusAffectation(Mobile.StatusAffectation.affecter);
                m.setDateEnvoie(now); // Reset send date
                mobileRepository.save(m);
                logSpecificHistory(m, "REAFFECTATION", now);
                break;
            case "CarteSim":
                CarteSim s = carteSimRepository.findById(specificId).orElseThrow();
                s.setStatusAffectation(CarteSim.StatusAffectation.affecter);
                s.setDateEnvoie(now);
                carteSimRepository.save(s);
                logSpecificHistory(s, "REAFFECTATION", now);
                break;
            case "LigneInternet":
                LigneInternet l = ligneInternetRepository.findById(specificId).orElseThrow();
                l.setStatusAffectation(LigneInternet.StatusAffectation.affecter);
                l.setDateEnvoie(now);
                ligneInternetRepository.save(l);
                logSpecificHistory(l, "REAFFECTATION", now);
                break;
            default: // Materiels
                Materiels it = materielsRepository.findById(specificId).orElseThrow();
                it.setStatusAffectation("affecter");
                it.setDateEnvoie(now);
                materielsRepository.save(it);
                logSpecificHistory(it, "REAFFECTATION", now);
                break;
        }

        // Unified
        mat.setStatusAffectation("affecter");
        mat.setDateEnvoie(now);
        materielRepository.save(mat);
        syncService.syncHistory(type, specificId, mat.getSn(), mat.getNumero(), mat.getOperateur(),
                mat.getMaterielName(), mat.getAffectedUser(), mat.getAgence(), mat.getEntrepot(), mat.getDepartement(),
                "REAFFECTATION", now);
    }

    // --- 4. RESET ASSIGNMENT (SUPPRIMER / RETOUR STOCK) ---
    // Switches status from 'annuler' to 'non_affecter' and clears User association
    public void resetAssignment(Integer materielId) {
        Materiel mat = materielRepository.findById(materielId).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        String type = mat.getTypeMateriel();
        Integer specificId = mat.getSpecificId();

        switch (type) {
            case "Mobile":
                Mobile m = mobileRepository.findById(specificId).orElseThrow();
                m.setStatusAffectation(Mobile.StatusAffectation.non_affecter);
                m.setUser(null); // Clear User
                m.setDepartement(null);
                mobileRepository.save(m);
                logSpecificHistory(m, "RETOUR_STOCK", now);
                break;
            case "CarteSim":
                CarteSim s = carteSimRepository.findById(specificId).orElseThrow();
                s.setStatusAffectation(CarteSim.StatusAffectation.non_affecter);
                s.setUser(null);
                carteSimRepository.save(s);
                logSpecificHistory(s, "RETOUR_STOCK", now);
                break;
            case "LigneInternet":
                LigneInternet l = ligneInternetRepository.findById(specificId).orElseThrow();
                l.setStatusAffectation(LigneInternet.StatusAffectation.non_affecter);
                // Ligne Internet usually stays with Agence, just clear Dept if any
                l.setDepartement(null);
                ligneInternetRepository.save(l);
                logSpecificHistory(l, "RETOUR_STOCK", now);
                break;
            default: // Materiels
                Materiels it = materielsRepository.findById(specificId).orElseThrow();
                it.setStatusAffectation("non_affecter");
                it.setUser(null);
                it.setDepartement(null);
                materielsRepository.save(it);
                logSpecificHistory(it, "RETOUR_STOCK", now);
                break;
        }

        // Unified (Clear User/Dept, Keep Agence)
        mat.setStatusAffectation("non_affecter");
        mat.setAffectedUser(null);
        mat.setDepartement(null);
        materielRepository.save(mat);

        syncService.syncHistory(type, specificId, mat.getSn(), mat.getNumero(), mat.getOperateur(),
                mat.getMaterielName(), null, mat.getAgence(), mat.getEntrepot(), null,
                "RETOUR_STOCK", now);
    }

    // --- History Helpers (Simplified for brevity) ---
    private void logSpecificHistory(Object entity, String event, LocalDateTime date) {
        if (entity instanceof Mobile) {
            Mobile m = (Mobile) entity;
            HistoriqueMobile h = new HistoriqueMobile();
            h.setMateriel(m);
            h.setSN(m.getSn());
            h.setStatusEvent(event);
            h.setDateEvent(date);
            histMobileRepo.save(historyAdminStampService.stamp(h));
        } else if (entity instanceof CarteSim) {
            CarteSim s = (CarteSim) entity;
            HistoriqueCartesim h = new HistoriqueCartesim();
            h.setMateriel(s);
            h.setSn(s.getSn());
            h.setStatusEvent(event);
            h.setDateEvent(date);
            histSimRepo.save(historyAdminStampService.stamp(h));
        } else if (entity instanceof LigneInternet) {
            LigneInternet l = (LigneInternet) entity;
            HistoriqueLigneinternet h = new HistoriqueLigneinternet();
            h.setMateriel(l);
            h.setSN(l.getSn());
            h.setStatusEvent(event);
            h.setDateEvent(date);
            histInternetRepo.save(historyAdminStampService.stamp(h));
        } else if (entity instanceof Materiels) {
            Materiels m = (Materiels) entity;
            HistoriqueMateriels h = new HistoriqueMateriels();
            h.setMateriels(m);
            h.setStatusEvent(event);
            h.setDateEvent(date);
            histMaterielsRepo.save(historyAdminStampService.stamp(h));
        }
    }
}
