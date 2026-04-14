package com.web.mdm.Repository;

import com.web.mdm.Models.Users;
import com.web.mdm.Repository.projection.UserDashboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UsersRepository extends JpaRepository<Users, Integer> {
    java.util.List<Users> findByManagerId(Integer managerId);

    java.util.List<Users> findByStatusIn(java.util.List<Users.UserStatus> statuses);

    /**
     * Loads ALL users with their lazy associations in a SINGLE SQL query.
     * Fixes the N+1 problem that caused only ~1122 out of 2800+ users to load.
     */
    @Query("SELECT DISTINCT u FROM Users u " +
           "LEFT JOIN FETCH u.departement " +
           "LEFT JOIN FETCH u.agence " +
           "LEFT JOIN FETCH u.entrepot " +
           "LEFT JOIN FETCH u.fonctionRef")
    java.util.List<Users> findAllWithAssociations();

    @Query("""
           SELECT u.id as id,
                  CAST(u.status as string) as status,
                  a.id as agenceId,
                  a.nom as agenceNom,
                  d.id as departementId,
                  d.nom as departementNom,
                  e.id as entrepotId,
                  s.libeller as entrepotNom
           FROM Users u
           LEFT JOIN u.agence a
           LEFT JOIN u.departement d
           LEFT JOIN u.entrepot e
           LEFT JOIN e.siteRef s
           """)
    java.util.List<UserDashboardProjection> findAllDashboardSummaries();
}
