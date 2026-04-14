package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueLigneinternet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueLigneinternetRepository extends JpaRepository<HistoriqueLigneinternet, Integer> {

    // --- NEW: Filter by Agence ---
    @Query("SELECT h FROM HistoriqueLigneinternet h " +
           "LEFT JOIN FETCH h.materiel m " +
           "LEFT JOIN FETCH m.agence a " +
           "WHERE a.id = :agenceId")
    List<HistoriqueLigneinternet> findByAgenceId(@Param("agenceId") Integer agenceId);

    @Query("SELECT h FROM HistoriqueLigneinternet h " +
           "LEFT JOIN FETCH h.materiel m " +
           "LEFT JOIN FETCH m.entrepot e " +
           "WHERE e.id = :entrepotId")
    List<HistoriqueLigneinternet> findByEntrepotId(@Param("entrepotId") Integer entrepotId);
}