package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueTicket;
import com.web.mdm.Repository.projection.HistoriqueTicketDashboardProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HistoriqueTicketRepository extends JpaRepository<HistoriqueTicket, Integer> {
    List<HistoriqueTicket> findByTicket_IdOrderByDateEventDescIdDesc(Integer ticketId);

    @Query("""
           SELECT h.id as id,
                  h.statusEvent as statusEvent,
                  h.dateEvent as dateEvent,
                  a.id as ticketSenderAgenceId
           FROM HistoriqueTicket h
           LEFT JOIN h.ticket t
           LEFT JOIN t.sender sender
           LEFT JOIN sender.agence a
           ORDER BY h.dateEvent DESC, h.id DESC
           """)
    List<HistoriqueTicketDashboardProjection> findAllDashboardSummaries();
}
