package com.web.mdm.Controllers;

import com.web.mdm.Dto.AgenceDto;
import com.web.mdm.Models.Agence;
import com.web.mdm.Models.HistoriqueAffectation;
import com.web.mdm.Models.Users;
import com.web.mdm.Models.Ville;
import com.web.mdm.Services.AgenceService;
import com.web.mdm.Services.HistoriqueAffectationService;
import com.web.mdm.Services.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agences")
@CrossOrigin(origins = "*")
public class AgenceController {

    private final AgenceService agenceService;
    private final UsersService usersService;
    private final HistoriqueAffectationService historiqueAffectationService;

    public AgenceController(AgenceService agenceService, UsersService usersService, HistoriqueAffectationService historiqueAffectationService) {
        this.agenceService = agenceService;
        this.usersService = usersService;
        this.historiqueAffectationService = historiqueAffectationService;
    }

    private AgenceDto toDto(Agence a) {
        String villeDisplay = "Non AssignÃ©e";
        Integer villeId = null;

        if (a.getVilles() != null && !a.getVilles().isEmpty()) {
            Ville v = a.getVilles().get(0);
            villeDisplay = v.getNom();
            villeId = v.getId();
        }

        int totalEffectif = (a.getUsers() != null) ? a.getUsers().size() : 0;
        int totalVilles = (a.getVilles() != null) ? a.getVilles().size() : 0;

        return new AgenceDto(
                a.getId(),
                a.getNom(),
                a.getEmail(),
                a.getTel(),
                a.getFax(),
                villeId,
                villeDisplay,
                a.getChefAgence() != null ? a.getChefAgence().getId() : null,
                a.getChefAgence() != null ? a.getChefAgence().getNom() + " " + a.getChefAgence().getPrenom()
                        : "Non AssignÃ©",
                totalEffectif,
                totalVilles);
    }

    @GetMapping
    public List<AgenceDto> getAll() {
        return agenceService.getAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgenceDto> getById(@PathVariable Integer id) {
        return agenceService.getById(id)
                .map(a -> ResponseEntity.ok(toDto(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AgenceDto dto) {
        Agence agence = new Agence();
        return saveOrUpdate(agence, dto, null);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody AgenceDto dto) {
        Agence existing = agenceService.getById(id).orElse(null);
        if (existing == null)
            return ResponseEntity.notFound().build();
        Integer previousChefId = existing.getChefAgence() != null ? existing.getChefAgence().getId() : null;
        return saveOrUpdate(existing, dto, previousChefId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        agenceService.delete(id);
    }

    private ResponseEntity<?> saveOrUpdate(Agence agence, AgenceDto dto, Integer previousChefId) {
        agence.setNom(dto.getNom());
        agence.setEmail(dto.getEmail());
        agence.setTel(dto.getTel());
        agence.setFax(dto.getFax());

        // Chef Agence
        Users newChef = null;
        if (dto.getChefAgenceId() != null) {
            newChef = usersService.getById(dto.getChefAgenceId()).orElse(null);
            agence.setChefAgence(newChef);
        } else {
            agence.setChefAgence(null);
        }

        Agence saved = agenceService.save(agence, dto.getVilleId());

        // --- Auto log historique if responsable changed ---
        Integer newChefId = dto.getChefAgenceId();
        boolean chefChanged = previousChefId != null && !previousChefId.equals(newChefId)
                || (previousChefId == null && newChefId != null);

        if (chefChanged) {
            HistoriqueAffectation hist = new HistoriqueAffectation();
            hist.setAgence(saved);
            hist.setAgenceNom(saved.getNom());
            hist.setAgenceTel(saved.getTel());
            hist.setAgenceEmail(saved.getEmail());
            hist.setStatusEvent("CHANGEMENT_RESPONSABLE");
            hist.setDateEvent(LocalDateTime.now());

            // New chef info
            if (newChef != null) {
                hist.setUser(newChef);
                hist.setUserNom(newChef.getNom());
                hist.setUserPrenom(newChef.getPrenom());
            }

            // Previous chef info stored in fonction field for traceability
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