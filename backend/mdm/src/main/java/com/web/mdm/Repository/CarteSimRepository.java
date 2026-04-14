package com.web.mdm.Repository;

import com.web.mdm.Models.CarteSim;
import com.web.mdm.Repository.projection.CarteSimDashboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CarteSimRepository extends JpaRepository<CarteSim, Integer> {

       @Query("SELECT s FROM CarteSim s " +
                     "LEFT JOIN FETCH s.user u " +
                     "LEFT JOIN FETCH s.agence a " +
                     "LEFT JOIN FETCH s.entrepot e " +
                     "LEFT JOIN FETCH s.departement sd " +
                     "LEFT JOIN FETCH u.departement d")
       List<CarteSim> findAllWithDetails();

       // --- NEW: Filter by Agence ---
       @Query("SELECT s FROM CarteSim s " +
                     "LEFT JOIN FETCH s.user u " +
                     "LEFT JOIN FETCH s.agence a " +
                     "LEFT JOIN FETCH s.entrepot e " +
                     "LEFT JOIN FETCH s.departement sd " +
                     "LEFT JOIN FETCH u.departement d " +
                     "WHERE a.id = :agenceId")
       List<CarteSim> findByAgenceId(@Param("agenceId") Integer agenceId);

       @Query("SELECT s FROM CarteSim s " +
                     "LEFT JOIN FETCH s.user u " +
                     "LEFT JOIN FETCH s.agence a " +
                     "LEFT JOIN FETCH s.entrepot e " +
                     "LEFT JOIN FETCH s.departement sd " +
                     "LEFT JOIN FETCH u.departement d " +
                     "WHERE e.id = :entrepotId")
       List<CarteSim> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

       @Query("""
                     SELECT s.id as id,
                            CAST(s.status as string) as status,
                            CAST(s.statusAffectation as string) as statusAffectation,
                            a.id as agenceId,
                            s.dateCreation as dateCreation
                     FROM CarteSim s
                     LEFT JOIN s.agence a
                     """)
       List<CarteSimDashboardProjection> findAllDashboardSummaries();

       // --- NEW: Check if user already has a SIM ---
       boolean existsByUser(com.web.mdm.Models.Users user);
}
