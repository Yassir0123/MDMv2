package com.web.mdm.Services;

import com.web.mdm.Models.Compte;
import com.web.mdm.Models.HistoriqueCartesim;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.HistoriqueCartesimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriqueCartesimService {

    @Autowired private HistoriqueCartesimRepository historiqueCarteSimRepository;
    @Autowired private CompteRepository compteRepository;

    // --- MODIFIED: Role-Based History Fetching ---
    public List<HistoriqueCartesim> getAll() {
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
                    return historiqueCarteSimRepository.findByAgenceId(managerProfile.getAgence().getId());
                }
                if (managerProfile != null && managerProfile.getEntrepot() != null) {
                    return historiqueCarteSimRepository.findByEntrepotId(managerProfile.getEntrepot().getId());
                }
            }
        }
        
        return historiqueCarteSimRepository.findAll();
    }

    public Optional<HistoriqueCartesim> getById(Integer id) {
        return historiqueCarteSimRepository.findById(id);
    }

    public HistoriqueCartesim save(HistoriqueCartesim historique) {
        return historiqueCarteSimRepository.save(historique);
    }

    public void delete(Integer id) {
        historiqueCarteSimRepository.deleteById(id);
    }
}