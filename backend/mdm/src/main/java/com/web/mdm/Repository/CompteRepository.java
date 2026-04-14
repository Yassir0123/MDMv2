package com.web.mdm.Repository;

import com.web.mdm.Models.Compte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CompteRepository extends JpaRepository<Compte, Integer> {
    Optional<Compte> findByLogin(String login);
    Optional<Compte> findFirstByUser_Id(Integer userId);
    java.util.List<Compte> findByUser_Id(Integer userId);
    Optional<Compte> findFirstByCompteTypeOrderByIdAsc(Compte.CompteType compteType);
    java.util.List<Compte> findByCompteType(Compte.CompteType compteType);
    Boolean existsByLogin(String login);
}
