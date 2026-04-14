package com.web.mdm.Controllers;

import com.web.mdm.Dto.AssignmentRequest;
import com.web.mdm.Dto.MaterielsDto;
import com.web.mdm.Models.Materiels;
import com.web.mdm.Services.AgenceService;
import com.web.mdm.Services.DepartementService;
import com.web.mdm.Services.EntrepotService;
import com.web.mdm.Services.MaterielsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/materiels")
@CrossOrigin(origins = "*")
public class MaterielsController {

    @Autowired private MaterielsService service;
    @Autowired private AgenceService agenceService;
    @Autowired private DepartementService departementService;
    @Autowired private EntrepotService entrepotService;

    @GetMapping
    public List<MaterielsDto> getAll() {
        return service.getAll().stream().map(m -> new MaterielsDto(
            m.getId(), m.getSn(), m.getDesignation(), m.getMarque(), m.getTypeMateriel(),
            m.getStatus(), m.getStatusAffectation(),
            m.getAgence() != null ? m.getAgence().getId() : null,
            m.getAgence() != null ? m.getAgence().getNom() : null,
            m.getEntrepot() != null ? m.getEntrepot().getId() : null,
            m.getEntrepot() != null && m.getEntrepot().getSiteRef() != null ? m.getEntrepot().getSiteRef().getLibeller() : null,
            m.getDepartement() != null ? m.getDepartement().getId() : null,
            m.getDepartement() != null ? m.getDepartement().getNom() : null,
            m.getUser() != null ? m.getUser().getId() : null,
            m.getUser() != null ? m.getUser().getNom() + " " + m.getUser().getPrenom() : null,
            m.getDateCreation(), m.getDateEnvoie()
        )).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MaterielsDto dto) {
        Materiels m = new Materiels();
        m.setSn(dto.getSn());
        m.setDesignation(dto.getDesignation());
        m.setMarque(dto.getMarque());
        m.setTypeMateriel(dto.getTypeMateriel());
        m.setStatus(dto.getStatus());
        
        if(dto.getAgenceId() != null) m.setAgence(agenceService.getById(dto.getAgenceId()).orElse(null));
        if(dto.getEntrepotId() != null) m.setEntrepot(entrepotService.getById(dto.getEntrepotId()).orElse(null));
        if(dto.getDepartementId() != null) m.setDepartement(departementService.getById(dto.getDepartementId()).orElse(null));

        service.save(m);
        return ResponseEntity.ok("Created");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody MaterielsDto dto) {
        Materiels m = service.getById(id).orElseThrow();
        m.setSn(dto.getSn());
        m.setDesignation(dto.getDesignation());
        m.setMarque(dto.getMarque());
        m.setTypeMateriel(dto.getTypeMateriel());
        m.setStatus(dto.getStatus());
        
        if(dto.getAgenceId() != null) m.setAgence(agenceService.getById(dto.getAgenceId()).orElse(null));
        if(dto.getEntrepotId() != null) m.setEntrepot(entrepotService.getById(dto.getEntrepotId()).orElse(null));
        
        service.save(m);
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { service.delete(id); }

    // @PostMapping("/assign")
    // public ResponseEntity<?> assign(@RequestBody AssignmentRequest req) {
    //     service.assignToUser(req.getMaterielId(), req.getUserId());
    //     return ResponseEntity.ok().build();
    // }
    @PostMapping("/assign")
    public ResponseEntity<?> assign(@RequestBody AssignmentRequest req) {
        // Calls the new flexible method
        service.assign(req.getMaterielId(), req.getAgenceId(), req.getEntrepotId(), req.getDepartementId(), req.getUserId());
        return ResponseEntity.ok().build();
    }
    @PostMapping("/unassign/{id}")
    public ResponseEntity<?> unassign(@PathVariable Integer id) {
        service.unassign(id);
        return ResponseEntity.ok().build();
    }
}