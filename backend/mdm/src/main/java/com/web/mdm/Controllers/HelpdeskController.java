package com.web.mdm.Controllers;

import com.web.mdm.Dto.HelpdeskBootstrapDto;
import com.web.mdm.Dto.HelpdeskTicketDetailDto;
import com.web.mdm.Dto.HelpdeskTicketSummaryDto;
import com.web.mdm.Dto.TicketAdminUpdateRequest;
import com.web.mdm.Dto.TicketCreateRequest;
import com.web.mdm.Dto.TicketReplyRequest;
import com.web.mdm.Models.TicketFile;
import com.web.mdm.Services.HelpdeskService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/helpdesk")
@CrossOrigin(origins = "*")
public class HelpdeskController {
    private final HelpdeskService helpdeskService;

    public HelpdeskController(HelpdeskService helpdeskService) {
        this.helpdeskService = helpdeskService;
    }

    @GetMapping("/bootstrap")
    public HelpdeskBootstrapDto getBootstrap() {
        return helpdeskService.getBootstrap();
    }

    @GetMapping("/tickets")
    public List<HelpdeskTicketSummaryDto> getTickets() {
        return helpdeskService.listVisibleTickets();
    }

    @GetMapping("/tickets/{ticketId}")
    public HelpdeskTicketDetailDto getTicket(@PathVariable Integer ticketId) {
        return helpdeskService.getTicketDetail(ticketId);
    }

    @PostMapping("/tickets/{ticketId}/claim")
    public HelpdeskTicketDetailDto claimTicket(@PathVariable Integer ticketId) {
        return helpdeskService.claimTicket(ticketId);
    }

    @PostMapping(path = "/tickets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HelpdeskTicketDetailDto createTicket(
            @RequestPart("payload") TicketCreateRequest payload,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return helpdeskService.createTicket(payload, files);
    }

    @PostMapping("/tickets/{ticketId}/messages")
    public HelpdeskTicketDetailDto replyToTicket(
            @PathVariable Integer ticketId,
            @RequestBody TicketReplyRequest payload) {
        return helpdeskService.replyToTicket(ticketId, payload);
    }

    @PutMapping("/tickets/{ticketId}/admin")
    public HelpdeskTicketDetailDto updateAdminTicket(
            @PathVariable Integer ticketId,
            @RequestBody TicketAdminUpdateRequest payload) {
        return helpdeskService.updateAdminTicket(ticketId, payload);
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Integer fileId) {
        TicketFile file = helpdeskService.getAccessibleFile(fileId);
        Resource resource = helpdeskService.loadFileAsResource(file);
        String fileName = Paths.get(file.getFilePath()).getFileName().toString();

        return ResponseEntity.ok()
                .contentType(MediaTypeFactory.getMediaType(fileName).orElse(MediaType.APPLICATION_OCTET_STREAM))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
