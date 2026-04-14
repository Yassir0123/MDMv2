package com.web.mdm.Controllers;

import com.web.mdm.Dto.AssignmentRequest;
import com.web.mdm.Dto.MobileDto;
import com.web.mdm.Models.Mobile;
import com.web.mdm.Services.MobileService;
import com.web.mdm.Services.AgenceService;
import com.web.mdm.Services.EntrepotService;
//import com.web.mdm.Services.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mobiles")
@CrossOrigin(origins = "*") 
public class MobileController {

    @Autowired private MobileService service;
    @Autowired private AgenceService agenceService;
    @Autowired private EntrepotService entrepotService;
    //@Autowired private UsersService usersService;

    @GetMapping
    public List<MobileDto> getAll() {
        return service.getAll().stream().map(m -> new MobileDto(
            m.getId(), 
            m.getSn(), 
            m.getImei(),
            m.getNom(), 
            m.getMarque(), 
            m.getModel(),
            m.getType() != null ? m.getType().toString() : "GSM",
            m.getStatus() != null ? m.getStatus().toString() : "inactive",
            m.getStatusAffectation() != null ? m.getStatusAffectation().toString() : "non_affecter",
            m.getAgence() != null ? m.getAgence().getId() : null,
            m.getAgence() != null ? m.getAgence().getNom() : null,
            m.getEntrepot() != null ? m.getEntrepot().getId() : null,
            m.getEntrepot() != null && m.getEntrepot().getSiteRef() != null ? m.getEntrepot().getSiteRef().getLibeller() : null,
            m.getUser() != null ? m.getUser().getId() : null,
            m.getUser() != null ? m.getUser().getNom() + " " + m.getUser().getPrenom() : null,
            m.getDepartement() != null ? m.getDepartement().getId() : null,
            m.getDepartement() != null ? m.getDepartement().getNom() : null,
            m.getDateEnvoie(),
            m.getDateCreation()
        )).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MobileDto dto) {
        Mobile mobile = convertToEntity(dto);
        // Optional: allow setting location directly (Agence / Entrepot) for stock
        if(dto.getAgenceId() != null) mobile.setAgence(agenceService.getById(dto.getAgenceId()).orElse(null));
        if(dto.getEntrepotId() != null) mobile.setEntrepot(entrepotService.getById(dto.getEntrepotId()).orElse(null));
        Mobile saved = service.save(mobile);
        return ResponseEntity.ok(saved.getId());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody MobileDto dto) {
        Mobile existing = service.getById(id).orElse(null);
        if(existing == null) return ResponseEntity.notFound().build();

        // Merge logic: Update only technical fields
        existing.setSn(dto.getSn());
        existing.setImei(dto.getImei());
        existing.setNom(dto.getNom());
        existing.setMarque(dto.getMarque());
        existing.setModel(dto.getModel());
        
        try { existing.setType(Mobile.MobileType.valueOf(dto.getType())); } catch(Exception e){}
        try { existing.setStatus(Mobile.Status.valueOf(dto.getStatus())); } catch(Exception e){}

        // Update Agence if provided
        if(dto.getAgenceId() != null) {
            existing.setAgence(agenceService.getById(dto.getAgenceId()).orElse(null));
        }
        if(dto.getEntrepotId() != null) {
            existing.setEntrepot(entrepotService.getById(dto.getEntrepotId()).orElse(null));
        }

        service.save(existing);
        return ResponseEntity.ok("Updated");
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { service.delete(id); }

    @PostMapping("/assign")
    public ResponseEntity<?> assign(@RequestBody AssignmentRequest req) {
        try {
            if (req.getUserId() != null) {
                service.assignToUser(req.getMaterielId(), req.getUserId(), req.getAgenceId(), req.getEntrepotId(), req.getDepartementId());
            } else if (req.getDepartementId() != null) {
                // Only allow Department assignment if no user is provided
                service.assignToDepartement(req.getMaterielId(), req.getDepartementId());
            } else {
                return ResponseEntity.badRequest().body("User ID or Department ID required");
            }
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

    private Mobile convertToEntity(MobileDto dto) {
        Mobile m = new Mobile();
        m.setId(dto.getId());
        m.setSn(dto.getSn());
        m.setImei(dto.getImei());
        m.setNom(dto.getNom());
        m.setMarque(dto.getMarque());
        m.setModel(dto.getModel());
        
        try { m.setType(Mobile.MobileType.valueOf(dto.getType())); } 
        catch (Exception e) { m.setType(Mobile.MobileType.GSM); }

        try { m.setStatus(Mobile.Status.valueOf(dto.getStatus())); } 
        catch (Exception e) { m.setStatus(Mobile.Status.inactive); }

        try { m.setStatusAffectation(Mobile.StatusAffectation.valueOf(dto.getStatusAffectation())); } 
        catch (Exception e) { m.setStatusAffectation(Mobile.StatusAffectation.non_affecter); }

        return m;
    }
}