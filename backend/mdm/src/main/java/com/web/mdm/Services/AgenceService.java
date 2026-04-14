package com.web.mdm.Services;

import com.web.mdm.Models.Agence;
import com.web.mdm.Models.Ville;
import com.web.mdm.Repository.AgenceRepository;
import com.web.mdm.Repository.VilleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AgenceService {

    @Autowired private AgenceRepository agenceRepository;
    @Autowired private VilleRepository villeRepository;

    public List<Agence> getAll() {
        return agenceRepository.findAll();
    }

    public Optional<Agence> getById(Integer id) {
        return agenceRepository.findById(id);
    }

    // --- MODIFIED: Transactional Save with Ville Update ---
    @Transactional
    public Agence save(Agence agence, Integer villeIdToAssign) {
        // 1. Save Agence first to ensure ID exists
        Agence savedAgence = agenceRepository.save(agence);

        // 2. Update the Ville (if provided)
        if (villeIdToAssign != null) {
            // Optional: If you want to enforce 1-to-1 UI behavior (clearing old ville links),
            // you could iterate over savedAgence.getVilles() and set their agence to null here.
            // But per your request "agence assigned to many villes", we just ADD this one.
            
            Ville ville = villeRepository.findById(villeIdToAssign).orElse(null);
            if (ville != null) {
                ville.setAgence(savedAgence);
                villeRepository.save(ville);
            }
        }

        return savedAgence;
    }

    public void delete(Integer id) {
        // Optional: Set associated villes to null before delete to avoid DB constraints
        Optional<Agence> agence = agenceRepository.findById(id);
        if(agence.isPresent()) {
            List<Ville> villes = agence.get().getVilles();
            for(Ville v : villes) {
                v.setAgence(null);
                villeRepository.save(v);
            }
        }
        agenceRepository.deleteById(id);
    }
}