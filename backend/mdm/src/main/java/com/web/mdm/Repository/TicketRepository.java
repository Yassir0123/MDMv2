package com.web.mdm.Repository;

import com.web.mdm.Models.Ticket;
import com.web.mdm.Models.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    List<Ticket> findAllByOrderByDateSentDesc();
    List<Ticket> findByStatus(Ticket.TicketStatus status);
    List<Ticket> findBySender_IdOrderByDateSentDesc(Integer senderId);

    @Modifying
    @Query("""
           update Ticket t
           set t.applier = :applier
           where t.id = :ticketId
             and t.applier is null
           """)
    int claimTicketIfUnclaimed(@Param("ticketId") Integer ticketId, @Param("applier") Users applier);

    @Query(value = "select applier_id from ticket where id = :ticketId", nativeQuery = true)
    Integer findApplierIdValueById(@Param("ticketId") Integer ticketId);
}
