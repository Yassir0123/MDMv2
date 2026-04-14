package com.web.mdm.Services;

import com.web.mdm.Models.Compte;
import com.web.mdm.Models.HistoriqueLigneinternet;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.HistoriqueLigneinternetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriqueLigneinternetService {

    @Autowired private HistoriqueLigneinternetRepository historiqueLigneInternetRepository;
    @Autowired private CompteRepository compteRepository;

    // --- MODIFIED: Role-Based History Fetching ---
    public List<HistoriqueLigneinternet> getAll() {
        // 1. Get Logged In User
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Compte currentCompte = compteRepository.findByLogin(email).orElse(null);

        if (currentCompte != null) {
            // 2. Check if Manager
            if ("Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
                // 3. Get Manager's Profile & Agence
                Users managerProfile = currentCompte.getUser();
                if (managerProfile != null && managerProfile.getAgence() != null) {
                    // Return ONLY history for this Agence
                    return historiqueLigneInternetRepository.findByAgenceId(managerProfile.getAgence().getId());
                }
                if (managerProfile != null && managerProfile.getEntrepot() != null) {
                    return historiqueLigneInternetRepository.findByEntrepotId(managerProfile.getEntrepot().getId());
                }
            }
        }

        return historiqueLigneInternetRepository.findAll();
    }

    public Optional<HistoriqueLigneinternet> getById(Integer id) {
        return historiqueLigneInternetRepository.findById(id);
    }

    public HistoriqueLigneinternet save(HistoriqueLigneinternet historique) {
        return historiqueLigneInternetRepository.save(historique);
    }

    public void delete(Integer id) {
        historiqueLigneInternetRepository.deleteById(id);
    }
}