package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueAffectation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueAffectationRepository extends JpaRepository<HistoriqueAffectation, Integer> {
    List<HistoriqueAffectation> findByAgenceId(Integer agenceId);

    List<HistoriqueAffectation> findByDepartementId(Integer departementId);

    List<HistoriqueAffectation> findByUserIdOrderByIdDesc(Integer userId);
}
