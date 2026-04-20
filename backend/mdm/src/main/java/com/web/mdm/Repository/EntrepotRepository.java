package com.web.mdm.Repository;

import com.web.mdm.Models.Entrepot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntrepotRepository extends JpaRepository<Entrepot, Integer> {
    @Query("SELECT DISTINCT e FROM Entrepot e " +
           "LEFT JOIN FETCH e.siteRef s " +
           "LEFT JOIN FETCH e.chefEntrepot c " +
           "LEFT JOIN FETCH e.users u")
    List<Entrepot> findAll();

    @Query("SELECT e FROM Entrepot e " +
           "LEFT JOIN FETCH e.siteRef s " +
           "LEFT JOIN FETCH e.chefEntrepot c " +
           "LEFT JOIN FETCH e.users u " +
           "WHERE e.id = :id")
    Optional<Entrepot> findById(Integer id);
}
