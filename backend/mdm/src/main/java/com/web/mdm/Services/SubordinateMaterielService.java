package com.web.mdm.Services;

import com.web.mdm.Models.*;
import com.web.mdm.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SubordinateMaterielService {

    @Autowired
    private MaterielRepository materielRepository;

    @Autowired
    private MobileRepository mobileRepository;
    @Autowired
    private CarteSimRepository carteSimRepository;
    @Autowired
    private LigneInternetRepository ligneInternetRepository;
    @Autowired
    private MaterielsRepository materielsRepository;

    @Autowired
    private HistoriqueMobileRepository histMobileRepo;
    @Autowired
    private HistoriqueCartesimRepository histSimRepo;
    @Autowired
    private HistoriqueLigneinternetRepository histInternetRepo;
    @Autowired
    private HistoriqueMaterielsRepository histMaterielsRepo;

    @Autowired
    private MaterielSyncService syncService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private HistoryAdminStampService historyAdminStampService;

    @Transactional
    public Materiel confirmReception(Integer materielId) {
        Materiel mat = materielRepository.findById(materielId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        LocalDateTime now = LocalDateTime.now();
        String type = mat.getTypeMateriel();
        Integer specificId = mat.getSpecificId();

        switch (type) {
            case "Mobile":
                handleMobileReception(mat, specificId, now);
                break;
            case "CarteSim":
                handleSimReception(mat, specificId, now);
                break;
            case "LigneInternet":
                handleInternetReception(mat, specificId, now);
                break;
            default:
                handleMaterielsReception(mat, specificId, now);
                break;
        }

        mat.setStatusAffectation("recu");
        mat.setDateRecu(now);
        materielRepository.save(mat);

        syncService.syncHistory(type, specificId, mat.getSn(), mat.getNumero(), mat.getOperateur(),
                mat.getMaterielName(), mat.getAffectedUser(), mat.getAgence(), mat.getEntrepot(), mat.getDepartement(),
                "RECEPTION", now);

        Integer actorUserId = notificationService.getCurrentActorUserId();
        Integer actedUserId = mat.getAffectedUser() != null ? mat.getAffectedUser().getId() : null;
        Integer targetUserId = actedUserId != null && !actedUserId.equals(actorUserId) ? actedUserId : null;
        notificationService.notifyReceptionOrSignalementToAdmin("Reception", type, mat.getMaterielName(),
                actedUserId, targetUserId);

        return mat;
    }

    @Transactional
    public Materiel annulerAffectation(Integer materielId, String motif, String commentaire) {
        Materiel mat = materielRepository.findById(materielId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        LocalDateTime now = LocalDateTime.now();
        String type = mat.getTypeMateriel();
        Integer specificId = mat.getSpecificId();

        Users affectedUser = mat.getAffectedUser();
        Agence agence = mat.getAgence();
        Entrepot entrepot = mat.getEntrepot();
        Departement departement = mat.getDepartement();

        switch (type) {
            case "Mobile":
                handleMobileAnnulation(mat, specificId, now, motif, commentaire);
                break;
            case "CarteSim":
                handleSimAnnulation(mat, specificId, now, motif, commentaire);
                break;
            case "LigneInternet":
                handleInternetAnnulation(mat, specificId, now, motif, commentaire);
                break;
            default:
                handleMaterielsAnnulation(mat, specificId, now, motif, commentaire);
                break;
        }

        mat.setStatusAffectation("annuler");
        mat.setDateAnnuler(now);
        // Keep the current assignee linked while the item is only reported/annule.
        materielRepository.save(mat);

        syncService.syncHistory(type, specificId, mat.getSn(), mat.getNumero(), mat.getOperateur(),
                mat.getMaterielName(), affectedUser, agence, entrepot, departement, "ANNULATION", now);

        Integer actorUserId = notificationService.getCurrentActorUserId();
        Integer actedUserId = affectedUser != null ? affectedUser.getId() : null;
        Integer targetUserId = actedUserId != null && !actedUserId.equals(actorUserId) ? actedUserId : null;
        notificationService.notifyReceptionOrSignalementToAdmin("Signalement", type, mat.getMaterielName(),
                actedUserId, targetUserId);

        return mat;
    }

    private void handleMobileReception(Materiel mat, Integer specificId, LocalDateTime now) {
        Mobile m = mobileRepository.findById(specificId).orElseThrow();
        m.setStatusAffectation(Mobile.StatusAffectation.recu);
        m.setDateRecu(now);
        mobileRepository.save(m);

        Users user = m.getUser() != null ? m.getUser() : mat.getAffectedUser();
        Agence agence = m.getAgence() != null ? m.getAgence() : mat.getAgence();
        Entrepot entrepot = m.getEntrepot() != null ? m.getEntrepot() : mat.getEntrepot();
        Departement dept = m.getDepartement() != null ? m.getDepartement() : mat.getDepartement();

        HistoriqueMobile hm = new HistoriqueMobile();
        hm.setMateriel(m);
        hm.setSN(m.getSn());
        hm.setNom(m.getNom());
        hm.setMarque(m.getMarque());
        hm.setModel(m.getModel());
        hm.setType(m.getType() != null ? m.getType().toString() : null);

        applyUserSnapshot(hm, user);
        applyContextSnapshot(hm, agence, entrepot, dept);

        hm.setStatusEvent("RECEPTION");
        hm.setDateEvent(now);
        hm.setDateRecu(now);
        histMobileRepo.save(historyAdminStampService.stamp(hm));
    }

    private void handleMobileAnnulation(Materiel mat, Integer specificId, LocalDateTime now, String motif,
            String commentaire) {
        Mobile m = mobileRepository.findById(specificId).orElseThrow();
        m.setStatusAffectation(Mobile.StatusAffectation.annuler);
        m.setDateAnnuler(now);
        mobileRepository.save(m);

        Users user = m.getUser() != null ? m.getUser() : mat.getAffectedUser();
        Agence agence = m.getAgence() != null ? m.getAgence() : mat.getAgence();
        Entrepot entrepot = m.getEntrepot() != null ? m.getEntrepot() : mat.getEntrepot();
        Departement dept = m.getDepartement() != null ? m.getDepartement() : mat.getDepartement();

        HistoriqueMobile hm = new HistoriqueMobile();
        hm.setMateriel(m);
        hm.setSN(m.getSn());
        hm.setNom(m.getNom());
        hm.setMarque(m.getMarque());
        hm.setModel(m.getModel());
        hm.setType(m.getType() != null ? m.getType().toString() : null);

        applyUserSnapshot(hm, user);
        applyContextSnapshot(hm, agence, entrepot, dept);

        hm.setStatusEvent("ANNULATION");
        hm.setDateEvent(now);
        hm.setDateAnnuler(now);
        hm.setMotif(motif);
        hm.setCommentaire(commentaire);
        histMobileRepo.save(historyAdminStampService.stamp(hm));
    }

    private void handleSimReception(Materiel mat, Integer specificId, LocalDateTime now) {
        CarteSim s = carteSimRepository.findById(specificId).orElseThrow();
        s.setStatusAffectation(CarteSim.StatusAffectation.recu);
        s.setDateRecu(now);
        carteSimRepository.save(s);

        Users user = s.getUser() != null ? s.getUser() : mat.getAffectedUser();
        Agence agence = s.getAgence() != null ? s.getAgence() : mat.getAgence();
        Entrepot entrepot = s.getEntrepot() != null ? s.getEntrepot() : mat.getEntrepot();
        Departement dept = s.getDepartement() != null ? s.getDepartement() : mat.getDepartement();

        HistoriqueCartesim hs = new HistoriqueCartesim();
        hs.setMateriel(s);
        hs.setSn(s.getSn());
        hs.setNumero(s.getNumero());
        hs.setOperateur(s.getOperateur());
        hs.setPin(s.getPin());
        hs.setPin2(s.getPin2());
        hs.setPuk(s.getPuk());
        hs.setPuk2(s.getPuk2());

        applyUserSnapshot(hs, user);
        applyContextSnapshot(hs, agence, entrepot, dept);

        hs.setStatusEvent("RECEPTION");
        hs.setDateEvent(now);
        hs.setDateRecu(now);
        histSimRepo.save(historyAdminStampService.stamp(hs));
    }

    private void handleSimAnnulation(Materiel mat, Integer specificId, LocalDateTime now, String motif,
            String commentaire) {
        CarteSim s = carteSimRepository.findById(specificId).orElseThrow();
        s.setStatusAffectation(CarteSim.StatusAffectation.annuler);
        s.setDateAnnuler(now);
        carteSimRepository.save(s);

        Users user = s.getUser() != null ? s.getUser() : mat.getAffectedUser();
        Agence agence = s.getAgence() != null ? s.getAgence() : mat.getAgence();
        Entrepot entrepot = s.getEntrepot() != null ? s.getEntrepot() : mat.getEntrepot();
        Departement dept = s.getDepartement() != null ? s.getDepartement() : mat.getDepartement();

        HistoriqueCartesim hs = new HistoriqueCartesim();
        hs.setMateriel(s);
        hs.setSn(s.getSn());
        hs.setNumero(s.getNumero());
        hs.setOperateur(s.getOperateur());
        hs.setPin(s.getPin());
        hs.setPin2(s.getPin2());
        hs.setPuk(s.getPuk());
        hs.setPuk2(s.getPuk2());

        applyUserSnapshot(hs, user);
        applyContextSnapshot(hs, agence, entrepot, dept);

        hs.setStatusEvent("ANNULATION");
        hs.setDateEvent(now);
        hs.setDateAnnuler(now);
        hs.setMotif(motif);
        hs.setCommentaire(commentaire);
        histSimRepo.save(historyAdminStampService.stamp(hs));
    }

    private void handleInternetReception(Materiel mat, Integer specificId, LocalDateTime now) {
        LigneInternet l = ligneInternetRepository.findById(specificId).orElseThrow();
        l.setStatusAffectation(LigneInternet.StatusAffectation.recu);
        l.setDateRecu(now);
        ligneInternetRepository.save(l);

        Users user = mat.getAffectedUser();
        Agence agence = l.getAgence() != null ? l.getAgence() : mat.getAgence();
        Entrepot entrepot = l.getEntrepot() != null ? l.getEntrepot() : mat.getEntrepot();
        Departement dept = l.getDepartement() != null ? l.getDepartement() : mat.getDepartement();

        HistoriqueLigneinternet hl = new HistoriqueLigneinternet();
        hl.setMateriel(l);
        hl.setSN(l.getSn());
        hl.setOperateur(l.getOperateur());
        hl.setVitesse(l.getVitesse());

        applyContextSnapshot(hl, agence, entrepot, dept);
        if (user != null) {
            hl.setUserId(user.getId());
            hl.setUserNom(user.getNom() + " " + user.getPrenom());
        }

        hl.setStatusEvent("RECEPTION");
        hl.setDateEvent(now);
        hl.setDateRecu(now);
        histInternetRepo.save(historyAdminStampService.stamp(hl));
    }

    private void handleInternetAnnulation(Materiel mat, Integer specificId, LocalDateTime now, String motif,
            String commentaire) {
        LigneInternet l = ligneInternetRepository.findById(specificId).orElseThrow();
        l.setStatusAffectation(LigneInternet.StatusAffectation.annuler);
        l.setDateAnnuler(now);
        ligneInternetRepository.save(l);

        Users user = mat.getAffectedUser();
        Agence agence = l.getAgence() != null ? l.getAgence() : mat.getAgence();
        Entrepot entrepot = l.getEntrepot() != null ? l.getEntrepot() : mat.getEntrepot();
        Departement dept = l.getDepartement() != null ? l.getDepartement() : mat.getDepartement();

        HistoriqueLigneinternet hl = new HistoriqueLigneinternet();
        hl.setMateriel(l);
        hl.setSN(l.getSn());
        hl.setOperateur(l.getOperateur());
        hl.setVitesse(l.getVitesse());

        applyContextSnapshot(hl, agence, entrepot, dept);
        if (user != null) {
            hl.setUserId(user.getId());
            hl.setUserNom(user.getNom() + " " + user.getPrenom());
        }

        hl.setStatusEvent("ANNULATION");
        hl.setDateEvent(now);
        hl.setDateAnnuler(now);
        hl.setMotif(motif);
        hl.setCommentaire(commentaire);
        histInternetRepo.save(historyAdminStampService.stamp(hl));
    }

    private void handleMaterielsReception(Materiel mat, Integer specificId, LocalDateTime now) {
        Materiels it = materielsRepository.findById(specificId).orElseThrow();
        it.setStatusAffectation("recu");
        it.setDateRecu(now);
        materielsRepository.save(it);

        Users user = it.getUser() != null ? it.getUser() : mat.getAffectedUser();
        Agence agence = it.getAgence() != null ? it.getAgence() : mat.getAgence();
        Entrepot entrepot = it.getEntrepot() != null ? it.getEntrepot() : mat.getEntrepot();
        Departement dept = it.getDepartement() != null ? it.getDepartement() : mat.getDepartement();

        HistoriqueMateriels h = new HistoriqueMateriels();
        h.setMateriels(it);
        h.setSn(it.getSn());
        h.setDesignation(it.getDesignation());
        h.setTypeMateriel(it.getTypeMateriel());
        h.setStatusEvent("RECEPTION");
        h.setDateEvent(now);
        h.setDateRecu(now);

        applyUserSnapshot(h, user, agence, entrepot, dept);
        applyContextSnapshot(h, agence, entrepot, dept);

        histMaterielsRepo.save(historyAdminStampService.stamp(h));
    }

    private void handleMaterielsAnnulation(Materiel mat, Integer specificId, LocalDateTime now, String motif,
            String commentaire) {
        Materiels it = materielsRepository.findById(specificId).orElseThrow();
        it.setStatusAffectation("annuler");
        it.setDateAnnuler(now);
        materielsRepository.save(it);

        Users user = it.getUser() != null ? it.getUser() : mat.getAffectedUser();
        Agence agence = it.getAgence() != null ? it.getAgence() : mat.getAgence();
        Entrepot entrepot = it.getEntrepot() != null ? it.getEntrepot() : mat.getEntrepot();
        Departement dept = it.getDepartement() != null ? it.getDepartement() : mat.getDepartement();

        HistoriqueMateriels h = new HistoriqueMateriels();
        h.setMateriels(it);
        h.setSn(it.getSn());
        h.setDesignation(it.getDesignation());
        h.setTypeMateriel(it.getTypeMateriel());
        h.setStatusEvent("ANNULATION");
        h.setDateEvent(now);
        h.setDateAnnuler(now);
        h.setMotif(motif);
        h.setCommentaire(commentaire);

        applyUserSnapshot(h, user, agence, entrepot, dept);
        applyContextSnapshot(h, agence, entrepot, dept);

        histMaterielsRepo.save(historyAdminStampService.stamp(h));
    }

    private void applyUserSnapshot(HistoriqueMobile h, Users user) {
        if (user == null) return;
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
    }

    private void applyUserSnapshot(HistoriqueCartesim h, Users user) {
        if (user == null) return;
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
    }

    private void applyUserSnapshot(HistoriqueMateriels h, Users user, Agence agence, Entrepot entrepot,
            Departement dept) {
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
            String location = (dept != null) ? "Dept: " + dept.getNom()
                    : (agence != null ? "Agence: " + agence.getNom()
                            : (entrepot != null ? "Entrepot" : "Stock Global"));
            h.setUserNom(location);
        }
    }

    private void applyContextSnapshot(HistoriqueMobile h, Agence agence, Entrepot entrepot, Departement dept) {
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
            h.setDepartmentNom(dept.getNom());
            h.setDepartmentEffective(dept.getEffective());
        }
    }

    private void applyContextSnapshot(HistoriqueCartesim h, Agence agence, Entrepot entrepot, Departement dept) {
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
    }

    private void applyContextSnapshot(HistoriqueLigneinternet h, Agence agence, Entrepot entrepot, Departement dept) {
        if (agence != null) {
            h.setAgence(agence);
            h.setAgenceNom(agence.getNom());
            if (agence.getChefAgence() != null) {
                h.setChefAgenceId(agence.getChefAgence().getId());
                h.setChefAgenceNom(agence.getChefAgence().getNom() + " " + agence.getChefAgence().getPrenom());
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
    }

    private void applyContextSnapshot(HistoriqueMateriels h, Agence agence, Entrepot entrepot, Departement dept) {
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
    }
}
