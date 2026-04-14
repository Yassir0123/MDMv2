package com.web.mdm.Repository;

import com.web.mdm.Models.Entrepot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntrepotRepository extends JpaRepository<Entrepot, Integer> {
}

