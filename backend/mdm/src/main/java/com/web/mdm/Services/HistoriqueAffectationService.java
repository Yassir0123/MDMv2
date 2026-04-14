package com.web.mdm.Services;

import com.web.mdm.Models.HistoriqueAffectation;
import com.web.mdm.Repository.HistoriqueAffectationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriqueAffectationService {

    @Autowired
    private HistoriqueAffectationRepository historiqueAffectationRepository;

    public List<HistoriqueAffectation> getAll() {
        return historiqueAffectationRepository.findAll();
    }

    public Optional<HistoriqueAffectation> getById(Integer id) {
        return historiqueAffectationRepository.findById(id);
    }

    public List<HistoriqueAffectation> getByAgenceId(Integer agenceId) {
        return historiqueAffectationRepository.findByAgenceId(agenceId);
    }

    public List<HistoriqueAffectation> getByDepartementId(Integer departementId) {
        return historiqueAffectationRepository.findByDepartementId(departementId);
    }

    public List<HistoriqueAffectation> getByUserId(Integer userId) {
        return historiqueAffectationRepository.findByUserIdOrderByIdDesc(userId);
    }

    public HistoriqueAffectation save(HistoriqueAffectation historique) {
        return historiqueAffectationRepository.save(historique);
    }

    public void delete(Integer id) {
        historiqueAffectationRepository.deleteById(id);
    }
}
