package com.web.mdm.Controllers;

import com.web.mdm.Dto.AssignmentRequest;
import com.web.mdm.Dto.LigneInternetDto;
import com.web.mdm.Models.LigneInternet;
import com.web.mdm.Services.AgenceService;
import com.web.mdm.Services.DepartementService;
import com.web.mdm.Services.EntrepotService;
import com.web.mdm.Services.LigneInternetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lignes-internet")
@CrossOrigin(origins = "*") 
public class LigneInternetController {

    @Autowired private LigneInternetService service;
    @Autowired private AgenceService agenceService;
    @Autowired private DepartementService departementService;
    @Autowired private EntrepotService entrepotService;

    @GetMapping
    public List<LigneInternetDto> getAll() {
        return service.getAll().stream().map(l -> new LigneInternetDto(
            l.getId(),
            l.getSn(),
            l.getOperateur(),
            l.getVitesse(),
            l.getStatus() != null ? l.getStatus().toString() : "inactive",
            l.getStatusAffectation() != null ? l.getStatusAffectation().toString() : "non_affecter",
            l.getAgence() != null ? l.getAgence().getId() : null,
            l.getAgence() != null ? l.getAgence().getNom() : null,
            l.getEntrepot() != null ? l.getEntrepot().getId() : null,
            l.getEntrepot() != null && l.getEntrepot().getSiteRef() != null ? l.getEntrepot().getSiteRef().getLibeller() : null,
            l.getDepartement() != null ? l.getDepartement().getId() : null,
            l.getDepartement() != null ? l.getDepartement().getNom() : null,
            l.getDateEnvoie(),
            l.getDateCreation()
        )).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LigneInternetDto dto) {
        LigneInternet line = convertToEntity(dto);
        // Initial setup
        if(dto.getAgenceId() != null) line.setAgence(agenceService.getById(dto.getAgenceId()).orElse(null));
        if(dto.getEntrepotId() != null) line.setEntrepot(entrepotService.getById(dto.getEntrepotId()).orElse(null));
        if(dto.getDepartementId() != null) line.setDepartement(departementService.getById(dto.getDepartementId()).orElse(null));
        
        service.save(line);
        return ResponseEntity.ok("Created");
    }

    // --- FIX: USE SERVICE UPDATE LOGIC ---
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody LigneInternetDto dto) {
        service.update(id, dto);
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { service.delete(id); }

    @PostMapping("/assign")
    public ResponseEntity<?> assign(@RequestBody AssignmentRequest req) {
        service.assign(req.getMaterielId(), req.getAgenceId(), req.getEntrepotId(), req.getDepartementId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resilier/{id}")
    public ResponseEntity<?> resilier(@PathVariable Integer id) {
        service.resilier(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/activate/{id}")
    public ResponseEntity<?> activate(@PathVariable Integer id) {
        service.activate(id);
        return ResponseEntity.ok().build();
    }

    private LigneInternet convertToEntity(LigneInternetDto dto) {
        LigneInternet l = new LigneInternet();
        l.setId(dto.getId());
        l.setSn(dto.getSn());
        l.setOperateur(dto.getOperateur());
        l.setVitesse(dto.getVitesse());
        try { l.setStatus(LigneInternet.Status.valueOf(dto.getStatus())); } 
        catch (Exception e) { l.setStatus(LigneInternet.Status.inactive); }
        return l;
    }
}