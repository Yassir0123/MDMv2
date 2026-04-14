package com.web.mdm.Repository;

import com.web.mdm.Models.Materiel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MaterielRepository extends JpaRepository<Materiel, Integer> {
    Optional<Materiel> findBySpecificIdAndTypeMateriel(Integer specificId, String typeMateriel);

    void deleteBySpecificIdAndTypeMateriel(Integer specificId, String typeMateriel);

    java.util.List<Materiel> findByAffectedUserIdAndStatusAffectation(Integer userId, String statusAffectation);

    java.util.List<Materiel> findByAffectedUserId(Integer userId);

    java.util.List<Materiel> findByAffectedUserIdIn(java.util.List<Integer> userIds);
}
