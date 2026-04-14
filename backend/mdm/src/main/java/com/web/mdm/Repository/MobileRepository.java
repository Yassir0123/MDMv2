package com.web.mdm.Repository;

import com.web.mdm.Models.Mobile;
import com.web.mdm.Repository.projection.MobileDashboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MobileRepository extends JpaRepository<Mobile, Integer> {

       @Query("SELECT m FROM Mobile m " +
                     "LEFT JOIN FETCH m.user u " +
                     "LEFT JOIN FETCH m.agence a " +
                     "LEFT JOIN FETCH m.entrepot e " +
                     "LEFT JOIN FETCH m.departement d")
       List<Mobile> findAllWithDetails();

       // --- NEW: Filter by Agence ID for Managers ---
       @Query("SELECT m FROM Mobile m " +
                     "LEFT JOIN FETCH m.user u " +
                     "LEFT JOIN FETCH m.agence a " +
                     "LEFT JOIN FETCH m.entrepot e " +
                     "LEFT JOIN FETCH m.departement d " +
                     "WHERE a.id = :agenceId")
       List<Mobile> findByAgenceId(@Param("agenceId") Integer agenceId);

       @Query("SELECT m FROM Mobile m " +
                     "LEFT JOIN FETCH m.user u " +
                     "LEFT JOIN FETCH m.agence a " +
                     "LEFT JOIN FETCH m.entrepot e " +
                     "LEFT JOIN FETCH m.departement d " +
                     "WHERE e.id = :entrepotId")
       List<Mobile> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

       @Query("""
                     SELECT m.id as id,
                            CAST(m.type as string) as type,
                            CAST(m.status as string) as status,
                            CAST(m.statusAffectation as string) as statusAffectation,
                            a.id as agenceId,
                            u.id as userId,
                            d.id as departementId,
                            e.id as entrepotId,
                            m.dateCreation as dateCreation
                     FROM Mobile m
                     LEFT JOIN m.user u
                     LEFT JOIN m.agence a
                     LEFT JOIN m.entrepot e
                     LEFT JOIN m.departement d
                     """)
       List<MobileDashboardProjection> findAllDashboardSummaries();

       // --- NEW: Check if user already has a Mobile ---
       boolean existsByUser(com.web.mdm.Models.Users user);
}
