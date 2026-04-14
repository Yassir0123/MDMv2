package com.web.mdm.Repository;

import com.web.mdm.Models.LigneInternet;
import com.web.mdm.Repository.projection.LigneInternetDashboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LigneInternetRepository extends JpaRepository<LigneInternet, Integer> {

    @Query("SELECT l FROM LigneInternet l " +
           "LEFT JOIN FETCH l.agence a " +
           "LEFT JOIN FETCH l.entrepot e " +
           "LEFT JOIN FETCH l.departement d")
    List<LigneInternet> findAllWithDetails();

    // --- NEW: Filter by Agence ID for Managers ---
    @Query("SELECT l FROM LigneInternet l " +
           "LEFT JOIN FETCH l.agence a " +
           "LEFT JOIN FETCH l.entrepot e " +
           "LEFT JOIN FETCH l.departement d " +
           "WHERE a.id = :agenceId")
    List<LigneInternet> findByAgenceId(@Param("agenceId") Integer agenceId);

    @Query("SELECT l FROM LigneInternet l " +
           "LEFT JOIN FETCH l.agence a " +
           "LEFT JOIN FETCH l.entrepot e " +
           "LEFT JOIN FETCH l.departement d " +
           "WHERE e.id = :entrepotId")
    List<LigneInternet> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

    @Query("""
           SELECT l.id as id,
                  CAST(l.status as string) as status,
                  CAST(l.statusAffectation as string) as statusAffectation,
                  a.id as agenceId,
                  l.dateCreation as dateCreation
           FROM LigneInternet l
           LEFT JOIN l.agence a
           """)
    List<LigneInternetDashboardProjection> findAllDashboardSummaries();
}
