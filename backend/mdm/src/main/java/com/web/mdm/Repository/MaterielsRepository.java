package com.web.mdm.Repository;

import com.web.mdm.Models.Materiels;
import com.web.mdm.Repository.projection.MaterielDashboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaterielsRepository extends JpaRepository<Materiels, Integer> {

       @Query("SELECT m FROM Materiels m " +
                     "LEFT JOIN FETCH m.user u " +
                     "LEFT JOIN FETCH m.agence a " +
                     "LEFT JOIN FETCH m.entrepot e " +
                     "LEFT JOIN FETCH m.departement d")
       List<Materiels> findAllWithDetails();

       // For Managers
       @Query("SELECT m FROM Materiels m " +
                     "LEFT JOIN FETCH m.user u " +
                     "LEFT JOIN FETCH m.agence a " +
                     "LEFT JOIN FETCH m.entrepot e " +
                     "LEFT JOIN FETCH m.departement d " +
                     "WHERE a.id = :agenceId")
       List<Materiels> findByAgenceId(@Param("agenceId") Integer agenceId);

       @Query("SELECT m FROM Materiels m " +
                     "LEFT JOIN FETCH m.user u " +
                     "LEFT JOIN FETCH m.agence a " +
                     "LEFT JOIN FETCH m.entrepot e " +
                     "LEFT JOIN FETCH m.departement d " +
                     "WHERE e.id = :entrepotId")
       List<Materiels> findByEntrepotId(@Param("entrepotId") Integer entrepotId);

       @Query("""
                     SELECT m.id as id,
                            m.typeMateriel as typeMateriel,
                            m.status as status,
                            m.statusAffectation as statusAffectation,
                            a.id as agenceId,
                            u.id as userId,
                            d.id as departementId,
                            e.id as entrepotId,
                            m.dateCreation as dateCreation
                     FROM Materiels m
                     LEFT JOIN m.user u
                     LEFT JOIN m.agence a
                     LEFT JOIN m.entrepot e
                     LEFT JOIN m.departement d
                     """)
       List<MaterielDashboardProjection> findAllDashboardSummaries();

       // --- NEW: Check if user already has this Type of Material ---
       boolean existsByUserAndTypeMateriel(com.web.mdm.Models.Users user, String typeMateriel);
}
