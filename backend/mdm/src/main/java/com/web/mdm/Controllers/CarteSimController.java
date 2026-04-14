package com.web.mdm.Controllers;

import com.web.mdm.Dto.AssignmentRequest;
import com.web.mdm.Dto.CarteSimDto;
import com.web.mdm.Models.CarteSim;
import com.web.mdm.Services.CarteSimService;
import com.web.mdm.Services.AgenceService;
import com.web.mdm.Services.DepartementService;
import com.web.mdm.Services.EntrepotService;
import com.web.mdm.Services.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cartesims")
@CrossOrigin(origins = "*") 
public class CarteSimController {

    @Autowired private CarteSimService service;
    @Autowired private AgenceService agenceService;
    @Autowired private EntrepotService entrepotService;
    @Autowired private DepartementService departementService;
    @Autowired private UsersService usersService;

    @GetMapping
    public List<CarteSimDto> getAll() {
        return service.getAll().stream().map(s -> new CarteSimDto(
            s.getId(), 
            s.getSn(), 
            s.getNumero(), 
            s.getOperateur(),
            s.getTarif(),       // <--- 1. PASS TO DTO
            s.getTypeForfait(), // <--- 1. PASS TO DTO
            s.getPin(), s.getPin2(), s.getPuk(), s.getPuk2(),
            s.getStatus() != null ? s.getStatus().toString() : "inactive",
            s.getStatusAffectation() != null ? s.getStatusAffectation().toString() : "non_affecter",
            s.getAgence() != null ? s.getAgence().getId() : null,
            s.getAgence() != null ? s.getAgence().getNom() : "Aucune",
            s.getEntrepot() != null ? s.getEntrepot().getId() : null,
            s.getEntrepot() != null && s.getEntrepot().getSiteRef() != null ? s.getEntrepot().getSiteRef().getLibeller() : null,
            s.getDepartement() != null ? s.getDepartement().getId() : (s.getUser() != null && s.getUser().getDepartement() != null ? s.getUser().getDepartement().getId() : null),
            s.getDepartement() != null ? s.getDepartement().getNom() : (s.getUser() != null && s.getUser().getDepartement() != null ? s.getUser().getDepartement().getNom() : null),
            s.getUser() != null ? s.getUser().getId() : null,
            s.getUser() != null ? s.getUser().getNom() + " " + s.getUser().getPrenom() : null,
            s.getDateEnvoie(),
            s.getDateCreation()
        )).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CarteSimDto dto) {
        CarteSim sim = convertToEntity(dto);
        CarteSim saved = service.save(sim);
        return ResponseEntity.ok(saved.getId());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody CarteSimDto dto) {
        CarteSim sim = convertToEntity(dto);
        sim.setId(id);
        service.save(sim);
        return ResponseEntity.ok("Updated");
    }

    private CarteSim convertToEntity(CarteSimDto dto) {
        CarteSim sim = new CarteSim();
        sim.setId(dto.getId());
        sim.setSn(dto.getSn());
        sim.setNumero(dto.getNumero());
        sim.setOperateur(dto.getOperateur());
        
        // --- 2. SAVE TO ENTITY ---
        sim.setTarif(dto.getTarif());
        sim.setTypeForfait(dto.getTypeForfait());
        // -------------------------

        sim.setPin(dto.getPin());
        sim.setPin2(dto.getPin2());
        sim.setPuk(dto.getPuk());
        sim.setPuk2(dto.getPuk2());
        
        try {
            sim.setStatus(CarteSim.Status.valueOf(dto.getStatus()));
        } catch (Exception e) { sim.setStatus(CarteSim.Status.active); }

        try {
            sim.setStatusAffectation(CarteSim.StatusAffectation.valueOf(dto.getStatusAffectation()));
        } catch (Exception e) { sim.setStatusAffectation(CarteSim.StatusAffectation.non_affecter); }

        if (dto.getAgenceId() != null) {
            sim.setAgence(agenceService.getById(dto.getAgenceId()).orElse(null));
        }

        if (dto.getEntrepotId() != null) {
            sim.setEntrepot(entrepotService.getById(dto.getEntrepotId()).orElse(null));
        }

        if (dto.getDepartementId() != null) {
            sim.setDepartement(departementService.getById(dto.getDepartementId()).orElse(null));
        }

        if (dto.getUserId() != null) {
            sim.setUser(usersService.getById(dto.getUserId()).orElse(null));
        }

        return sim;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { service.delete(id); }

    @PostMapping("/assign")
    public ResponseEntity<?> assign(@RequestBody AssignmentRequest req) {
        try {
            service.assignToUser(req.getMaterielId(), req.getUserId(), req.getAgenceId(), req.getEntrepotId(), req.getDepartementId());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/unassign/{id}")
    public ResponseEntity<?> unassign(@PathVariable Integer id) {
        service.unassign(id);
        return ResponseEntity.ok().build();
    }
}