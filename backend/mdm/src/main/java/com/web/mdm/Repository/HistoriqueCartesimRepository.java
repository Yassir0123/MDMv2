package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueCartesim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueCartesimRepository extends JpaRepository<HistoriqueCartesim, Integer> {
    
    // Fetches History + User + Agence + Dept to avoid N+1 on frontend display
    @Query("SELECT h FROM HistoriqueCartesim h " +
           "LEFT JOIN FETCH h.materiel m " +
           "LEFT JOIN FETCH h.user u " +
           "LEFT JOIN FETCH h.agence a " +
           "LEFT JOIN FETCH h.entrepot e " +
           "LEFT JOIN FETCH h.departement d " +
           "WHERE a.id = :agenceId")
    List<HistoriqueCartesim> findByAgenceId(@Param("agenceId") Integer agenceId);

    @Query("SELECT h FROM HistoriqueCartesim h " +
           "LEFT JOIN FETCH h.materiel m " +
           "LEFT JOIN FETCH h.user u " +
           "LEFT JOIN FETCH h.agence a " +
           "LEFT JOIN FETCH h.entrepot e " +
           "LEFT JOIN FETCH h.departement d " +
           "WHERE e.id = :entrepotId")
    List<HistoriqueCartesim> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

    // Default findAll with joins
    @Query("SELECT h FROM HistoriqueCartesim h " +
           "LEFT JOIN FETCH h.materiel m " +
           "LEFT JOIN FETCH h.user u " +
           "LEFT JOIN FETCH h.agence a " +
           "LEFT JOIN FETCH h.entrepot e " +
           "LEFT JOIN FETCH h.departement d")
    List<HistoriqueCartesim> findAll();
}