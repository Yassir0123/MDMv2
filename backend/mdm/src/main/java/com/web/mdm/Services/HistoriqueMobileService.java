package com.web.mdm.Services;

import com.web.mdm.Models.Compte;
import com.web.mdm.Models.HistoriqueMobile;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.HistoriqueMobileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriqueMobileService {

    @Autowired private HistoriqueMobileRepository historiqueMobileRepository;
    @Autowired private CompteRepository compteRepository;

    // --- MODIFIED: Role-Based History Fetching ---
    public List<HistoriqueMobile> getAll() {
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
                    return historiqueMobileRepository.findByAgenceId(managerProfile.getAgence().getId());
                }
                if (managerProfile != null && managerProfile.getEntrepot() != null) {
                    return historiqueMobileRepository.findByEntrepotId(managerProfile.getEntrepot().getId());
                }
            }
        }
        
        return historiqueMobileRepository.findAll();
    }

    public Optional<HistoriqueMobile> getById(Integer id) {
        return historiqueMobileRepository.findById(id);
    }

    public HistoriqueMobile save(HistoriqueMobile historique) {
        return historiqueMobileRepository.save(historique);
    }

    public void delete(Integer id) {
        historiqueMobileRepository.deleteById(id);
    }
}