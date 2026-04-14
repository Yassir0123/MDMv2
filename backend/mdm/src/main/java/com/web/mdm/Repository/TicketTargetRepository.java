package com.web.mdm.Repository;

import com.web.mdm.Models.TicketTarget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketTargetRepository extends JpaRepository<TicketTarget, Integer> {
    List<TicketTarget> findByTicket_Id(Integer ticketId);
    List<TicketTarget> findByTarget_Id(Integer targetId);
    List<TicketTarget> findByTarget_IdOrderByTicket_DateSentDesc(Integer targetId);
    boolean existsByTicket_IdAndTarget_Id(Integer ticketId, Integer targetId);
}
