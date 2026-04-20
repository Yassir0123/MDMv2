package com.web.mdm.Services;

import com.web.mdm.Models.*;
import com.web.mdm.Repository.HistoriqueMaterielRepository;
import com.web.mdm.Repository.MaterielRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class MaterielSyncService {

    @Autowired
    private MaterielRepository materielRepository;
    @Autowired
    private HistoriqueMaterielRepository histRepo;
    @Autowired
    private HistoryAdminStampService historyAdminStampService;

    // --- SYNC INVENTORY ---
    @Transactional
    public void syncInventory(String type, Integer specificId, String sn, String num, String operator,
            String name, Users user, Agence agence, Entrepot entrepot, Departement dept,
            String status, String statusAffect,
            LocalDateTime dRecu, LocalDateTime dEnvoie, LocalDateTime dAnnuler, LocalDateTime dCreation) {

        // Find existing or create new
        Materiel mat = materielRepository.findBySpecificIdAndTypeMateriel(specificId, type)
                .orElse(new Materiel());

        mat.setSpecificId(specificId);
        mat.setTypeMateriel(type);
        mat.setSn(sn);
        mat.setNumero(num);
        mat.setOperateur(operator);
        mat.setMaterielName(name);

        mat.setAffectedUser(user);
        mat.setAgence(agence);
        mat.setEntrepot(entrepot);
        mat.setDepartement(dept);

        mat.setStatus(status);
        mat.setStatusAffectation(statusAffect);

        mat.setDateRecu(dRecu);
        mat.setDateEnvoie(dEnvoie);
        mat.setDateAnnuler(dAnnuler);
        mat.setDateCreation(dCreation);

        materielRepository.save(mat);
    }

    @Transactional
    public void deleteFromInventory(String type, Integer specificId) {
        materielRepository.deleteBySpecificIdAndTypeMateriel(specificId, type);
    }

    // --- SYNC HISTORY ---
    public void syncHistory(String type, Integer specificId, String sn, String num, String operator,
            String name, Users user, Agence agence, Entrepot entrepot, Departement dept,
            String event, LocalDateTime dateEvent) {

        HistoriqueMateriel h = new HistoriqueMateriel();
        h.setTypeMateriel(type);
        h.setMaterielId(specificId);
        h.setSn(sn);
        h.setNumero(num);
        h.setOperateur(operator);
        h.setMaterielName(name);

        h.setAgence(agence);
        h.setEntrepot(entrepot);
        h.setDepartement(dept);

        if (agence != null)
            h.setAgenceNom(agence.getNom());
        if (entrepot != null && entrepot.getSiteRef() != null)
            h.setEntrepotNom(entrepot.getSiteRef().getLibeller());
        if (dept != null)
            h.setDepartementNom(dept.getNom());

        h.setAffectedUser(user);
        if (user != null) {
            h.setUserNom(user.getNom());
            h.setUserPrenom(user.getPrenom());
            h.setUserCin(user.getCin());
            h.setUserMatricule(user.getMatricule());
            h.setUserFonction(user.getFonctionRef() != null ? user.getFonctionRef().getNom() : null);
            h.setUserStatus(user.getStatus() != null ? user.getStatus().toString() : "");
        }

        h.setStatusEvent(event);
        h.setDateEvent(dateEvent);
        h.setDateRecu(event.equals("CREATION") ? dateEvent : null);
        h.setDateEnvoie(event.contains("AFFECTATION") ? dateEvent : null);
        h.setDateAnnuler(event.equals("RESILIATION") ? dateEvent : null);

        histRepo.save(historyAdminStampService.stamp(h));
    }
}
