package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueMateriels;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueMaterielsRepository extends JpaRepository<HistoriqueMateriels, Integer> {

       // Filter by the direct agence FK on the historique row
       @Query("SELECT h FROM HistoriqueMateriels h WHERE h.agence.id = :agenceId")
       List<HistoriqueMateriels> findByAgenceId(@Param("agenceId") Integer agenceId);

       // Filter by the direct entrepot FK on the historique row
       @Query("SELECT h FROM HistoriqueMateriels h WHERE h.entrepot.id = :entrepotId")
       List<HistoriqueMateriels> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

       // Fetch all history for a specific Materiels entity
       @Query("SELECT h FROM HistoriqueMateriels h WHERE h.materiels.id = :materielsId ORDER BY h.dateEvent DESC")
       List<HistoriqueMateriels> findByMaterielsId(@Param("materielsId") Integer materielsId);
}