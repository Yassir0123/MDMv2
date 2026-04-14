package com.web.mdm.Repository;

import com.web.mdm.Models.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, Integer> {
    List<TicketMessage> findByTicket_IdOrderByPositionAsc(Integer ticketId);
    Optional<TicketMessage> findTopByTicket_IdOrderByPositionDesc(Integer ticketId);
    long countByTicket_Id(Integer ticketId);
}
