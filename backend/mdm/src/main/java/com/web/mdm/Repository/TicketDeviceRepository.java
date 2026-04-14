package com.web.mdm.Repository;

import com.web.mdm.Models.TicketDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketDeviceRepository extends JpaRepository<TicketDevice, Integer> {
    List<TicketDevice> findByTicket_Id(Integer ticketId);
}
