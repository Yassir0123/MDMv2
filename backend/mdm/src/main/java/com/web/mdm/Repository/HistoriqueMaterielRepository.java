package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueMateriel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueMaterielRepository extends JpaRepository<HistoriqueMateriel, Integer> {
    
    // --- FIX: Changed 'h.user' to 'h.affectedUser' ---
    @Query("SELECT h FROM HistoriqueMateriel h " +
           "LEFT JOIN FETCH h.affectedUser " + // Correct field name
           "LEFT JOIN FETCH h.agence " +
           "LEFT JOIN FETCH h.departement " +
           "ORDER BY h.dateEvent DESC")
    List<HistoriqueMateriel> findAllWithDetails();
    
    // This query is fine as it relies on simple fields if auto-generated, 
    // but if you have a custom query here, check field names too.
    List<HistoriqueMateriel> findByTypeMaterielAndMaterielId(String type, Integer id);

    @Query("SELECT h FROM HistoriqueMateriel h " +
           "LEFT JOIN FETCH h.affectedUser " +
           "LEFT JOIN FETCH h.agence " +
           "LEFT JOIN FETCH h.departement " +
           "LEFT JOIN FETCH h.entrepot " +
           "WHERE h.affectedUser.id = :userId " +
           "ORDER BY h.id DESC")
    List<HistoriqueMateriel> findByAffectedUserId(@Param("userId") Integer userId);
}
