package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueMobile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueMobileRepository extends JpaRepository<HistoriqueMobile, Integer> {

       // Filter by the direct agence FK on the historique row
       @Query("SELECT h FROM HistoriqueMobile h WHERE h.agence.id = :agenceId")
       List<HistoriqueMobile> findByAgenceId(@Param("agenceId") Integer agenceId);

       // Filter by the direct entrepot FK on the historique row
       @Query("SELECT h FROM HistoriqueMobile h WHERE h.entrepot.id = :entrepotId")
       List<HistoriqueMobile> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

       // Fetch all history for a specific Mobile entity
       @Query("SELECT h FROM HistoriqueMobile h WHERE h.materiel.id = :materielId ORDER BY h.dateEvent DESC")
       List<HistoriqueMobile> findByMaterielId(@Param("materielId") Integer materielId);
}