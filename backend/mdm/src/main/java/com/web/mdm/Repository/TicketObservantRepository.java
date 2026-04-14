package com.web.mdm.Repository;

import com.web.mdm.Models.TicketObservant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketObservantRepository extends JpaRepository<TicketObservant, Integer> {
    List<TicketObservant> findByTicket_Id(Integer ticketId);
    List<TicketObservant> findByObservant_Id(Integer observantId);
    List<TicketObservant> findByObservant_IdOrderByTicket_DateSentDesc(Integer observantId);
    boolean existsByTicket_IdAndObservant_Id(Integer ticketId, Integer observantId);
}
