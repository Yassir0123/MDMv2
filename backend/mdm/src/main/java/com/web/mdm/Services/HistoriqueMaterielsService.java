package com.web.mdm.Services;

import com.web.mdm.Models.Compte;
import com.web.mdm.Models.HistoriqueMateriels;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.HistoriqueMaterielsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriqueMaterielsService {
    @Autowired
    private HistoriqueMaterielsRepository repository;
    @Autowired
    private CompteRepository compteRepository;

    // Role-Based History Fetching (same pattern as CarteSim)
    public List<HistoriqueMateriels> getAll() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Compte currentCompte = compteRepository.findByLogin(email).orElse(null);

        if (currentCompte != null) {
            if ("Manager".equalsIgnoreCase(String.valueOf(currentCompte.getCompteType()))) {
                Users managerProfile = currentCompte.getUser();
                if (managerProfile != null && managerProfile.getAgence() != null) {
                    return repository.findByAgenceId(managerProfile.getAgence().getId());
                }
                if (managerProfile != null && managerProfile.getEntrepot() != null) {
                    return repository.findByEntrepotId(managerProfile.getEntrepot().getId());
                }
            }
        }

        return repository.findAll();
    }

    public List<HistoriqueMateriels> getByMaterielId(Integer id) {
        return repository.findByMaterielsId(id);
    }

    public Optional<HistoriqueMateriels> getById(Integer id) {
        return repository.findById(id);
    }

    public HistoriqueMateriels save(HistoriqueMateriels historique) {
        return repository.save(historique);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }
}