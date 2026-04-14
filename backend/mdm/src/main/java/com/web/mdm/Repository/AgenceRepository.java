package com.web.mdm.Repository;

import com.web.mdm.Models.Agence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AgenceRepository extends JpaRepository<Agence, Integer> {

    // OLD (Causing Error): LEFT JOIN FETCH a.ville
    // NEW (Correct):       LEFT JOIN FETCH a.villes

    @Query("SELECT a FROM Agence a " +
           "LEFT JOIN FETCH a.villes v " +       // <--- Changed 'ville' to 'villes'
           "LEFT JOIN FETCH a.chefAgence u")
    List<Agence> findAll();
}