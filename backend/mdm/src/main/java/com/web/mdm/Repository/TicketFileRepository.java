package com.web.mdm.Repository;

import com.web.mdm.Models.TicketFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketFileRepository extends JpaRepository<TicketFile, Integer> {
    List<TicketFile> findByTicket_Id(Integer ticketId);
}
