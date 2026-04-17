package com.web.mdm.Repository;

import com.web.mdm.Models.HistoriqueTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoriqueTicketRepository extends JpaRepository<HistoriqueTicket, Integer> {
    List<HistoriqueTicket> findByTicket_IdOrderByDateEventDescIdDesc(Integer ticketId);
}
