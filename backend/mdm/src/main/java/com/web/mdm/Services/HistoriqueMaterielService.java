package com.web.mdm.Services;

import com.web.mdm.Models.HistoriqueMateriel;
import com.web.mdm.Repository.HistoriqueMaterielRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistoriqueMaterielService {

    @Autowired
    private HistoriqueMaterielRepository repository;

    public List<HistoriqueMateriel> getAll() {
        return repository.findAllWithDetails();
    }

    public List<HistoriqueMateriel> getByItem(String type, Integer id) {
        return repository.findByTypeMaterielAndMaterielId(type, id);
    }

    public List<HistoriqueMateriel> getByUserId(Integer userId) {
        return repository.findByAffectedUserId(userId);
    }

    public HistoriqueMateriel save(HistoriqueMateriel history) {
        // Auto-fill names if entities are present but names are null
        if (history.getAgence() != null && history.getAgenceNom() == null) {
            history.setAgenceNom(history.getAgence().getNom());
        }
        if (history.getDepartement() != null && history.getDepartementNom() == null) {
            history.setDepartementNom(history.getDepartement().getNom());
        }
        return repository.save(history);
    }
}
