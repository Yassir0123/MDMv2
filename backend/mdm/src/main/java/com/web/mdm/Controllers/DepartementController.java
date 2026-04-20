package com.web.mdm.Controllers;

import com.web.mdm.Dto.DepartementDto;
import com.web.mdm.Models.Departement;
import com.web.mdm.Models.HistoriqueAffectation;
import com.web.mdm.Models.Users;
import com.web.mdm.Services.DepartementService;
import com.web.mdm.Services.HistoriqueAffectationService;
import com.web.mdm.Services.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departements")
@CrossOrigin(origins = "*")
public class DepartementController {

    @Autowired
    private DepartementService departementService;
    @Autowired
    private UsersService usersService;
    @Autowired
    private HistoriqueAffectationService historiqueAffectationService;

    private DepartementDto toDto(Departement d) {
        int totalEffectif = (d.getUsers() != null) ? d.getUsers().size() : 0;

        // Try to derive agence from chef or first user
        Integer agenceId = null;
        String agenceNom = null;
        if (d.getChefDepartment() != null && d.getChefDepartment().getAgence() != null) {
            agenceId = d.getChefDepartment().getAgence().getId();
            agenceNom = d.getChefDepartment().getAgence().getNom();
        }

        return new DepartementDto(
                d.getId(),
                d.getNom(),
                d.getEffective(),
                totalEffectif,
                agenceId,
                agenceNom,
                d.getChefDepartment() != null ? d.getChefDepartment().getId() : null,
                d.getChefDepartment() != null
                        ? d.getChefDepartment().getNom() + " " + d.getChefDepartment().getPrenom()
                        : "Non AssignÃ©");
    }

    @Transactional
    @GetMapping
    public List<DepartementDto> getAll() {
        return departementService.getAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    @GetMapping("/{id}")
    public ResponseEntity<DepartementDto> getById(@PathVariable Integer id) {
        return departementService.getById(id)
                .map(d -> ResponseEntity.ok(toDto(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DepartementDto dto) {
        Departement dept = new Departement();
        return saveOrUpdate(dept, dto, null);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody DepartementDto dto) {
        Departement existing = departementService.getById(id).orElse(null);
        if (existing == null)
            return ResponseEntity.notFound().build();
        Integer previousChefId = existing.getChefDepartment() != null ? existing.getChefDepartment().getId() : null;
        return saveOrUpdate(existing, dto, previousChefId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        departementService.delete(id);
    }

    private ResponseEntity<?> saveOrUpdate(Departement dept, DepartementDto dto, Integer previousChefId) {
        dept.setNom(dto.getNom());

        // Chef Departement
        Users newChef = null;
        if (dto.getChefDepartementId() != null) {
            newChef = usersService.getById(dto.getChefDepartementId()).orElse(null);
            dept.setChefDepartment(newChef);
        } else {
            dept.setChefDepartment(null);
        }

        Departement saved = departementService.save(dept);

        // --- Auto log historique if chef changed ---
        Integer newChefId = dto.getChefDepartementId();
        boolean chefChanged = (previousChefId != null && !previousChefId.equals(newChefId))
                || (previousChefId == null && newChefId != null);

        if (chefChanged) {
            HistoriqueAffectation hist = new HistoriqueAffectation();
            hist.setDepartement(saved);
            hist.setDepartmentNom(saved.getNom());
            hist.setStatusEvent("CHANGEMENT_RESPONSABLE");
            hist.setDateEvent(LocalDateTime.now());

            // New chef info
            if (newChef != null) {
                hist.setUser(newChef);
                hist.setUserNom(newChef.getNom());
                hist.setUserPrenom(newChef.getPrenom());
            }

            // Previous chef info
            if (previousChefId != null) {
                Users prevChef = usersService.getById(previousChefId).orElse(null);
                if (prevChef != null) {
                    hist.setFonction("Ancien responsable: " + prevChef.getNom() + " " + prevChef.getPrenom() + " (ID: "
                            + prevChef.getId() + ")");
                }
            }

            historiqueAffectationService.save(hist);
        }

        return ResponseEntity.ok(saved.getId());
    }
}