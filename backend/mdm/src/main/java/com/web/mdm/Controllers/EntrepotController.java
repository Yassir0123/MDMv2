package com.web.mdm.Controllers;

import com.web.mdm.Dto.EntrepotDto;
import com.web.mdm.Models.Entrepot;
import com.web.mdm.Models.HistoriqueAffectation;
import com.web.mdm.Models.Site;
import com.web.mdm.Models.Users;
import com.web.mdm.Services.EntrepotService;
import com.web.mdm.Services.HistoriqueAffectationService;
import com.web.mdm.Services.SiteService;
import com.web.mdm.Services.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/entrepots")
@CrossOrigin(origins = "*")
public class EntrepotController {
    @Autowired private EntrepotService entrepotService;
    @Autowired private SiteService siteService;
    @Autowired private UsersService usersService;
    @Autowired private HistoriqueAffectationService historiqueAffectationService;

    @GetMapping
    public List<EntrepotDto> getAll() {
        return entrepotService.getAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntrepotDto> getById(@PathVariable Integer id) {
        return entrepotService.getById(id)
                .map(entrepot -> ResponseEntity.ok(toDto(entrepot)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody EntrepotDto dto) {
        return saveOrUpdate(new Entrepot(), dto, null);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody EntrepotDto dto) {
        Entrepot existing = entrepotService.getById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        Integer previousChefId = existing.getChefEntrepot() != null ? existing.getChefEntrepot().getId() : null;
        return saveOrUpdate(existing, dto, previousChefId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { entrepotService.delete(id); }

    private EntrepotDto toDto(Entrepot entrepot) {
        Site site = entrepot.getSiteRef();
        int totalEffectif = entrepot.getUsers() != null ? entrepot.getUsers().size() : 0;

        return new EntrepotDto(
                entrepot.getId(),
                entrepot.getNom(),
                site != null ? site.getId() : null,
                site != null ? site.getLibeller() : "Non assigne",
                entrepot.getTelephone(),
                entrepot.getEmail(),
                entrepot.getFax(),
                entrepot.getChefEntrepot() != null ? entrepot.getChefEntrepot().getId() : null,
                entrepot.getChefEntrepot() != null
                        ? entrepot.getChefEntrepot().getNom() + " " + entrepot.getChefEntrepot().getPrenom()
                        : "Non assigne",
                totalEffectif,
                site != null ? 1 : 0);
    }

    private ResponseEntity<?> saveOrUpdate(Entrepot entrepot, EntrepotDto dto, Integer previousChefId) {
        entrepot.setNom(dto.getNom());
        entrepot.setTelephone(dto.getTelephone());
        entrepot.setEmail(dto.getEmail());
        entrepot.setFax(dto.getFax());

        Site site = dto.getSiteId() != null ? siteService.getById(dto.getSiteId()).orElse(null) : null;
        entrepot.setSiteRef(site);

        Users newChef = dto.getChefEntrepotId() != null ? usersService.getById(dto.getChefEntrepotId()).orElse(null) : null;
        entrepot.setChefEntrepot(newChef);

        Entrepot saved = entrepotService.save(entrepot);

        Integer newChefId = dto.getChefEntrepotId();
        boolean chefChanged = previousChefId != null && !previousChefId.equals(newChefId)
                || (previousChefId == null && newChefId != null);

        if (chefChanged) {
            HistoriqueAffectation hist = new HistoriqueAffectation();
            hist.setEntrepot(saved);
            hist.setEntrepotNom(site != null ? site.getLibeller() : "Entrepot #" + saved.getId());
            hist.setStatusEvent("CHANGEMENT_RESPONSABLE");
            hist.setDateEvent(LocalDateTime.now());

            if (newChef != null) {
                hist.setUser(newChef);
                hist.setUserNom(newChef.getNom());
                hist.setUserPrenom(newChef.getPrenom());
                hist.setChefEntrepotId(newChef.getId());
            }

            if (previousChefId != null) {
                Users previousChef = usersService.getById(previousChefId).orElse(null);
                if (previousChef != null) {
                    hist.setFonction("Ancien responsable: " + previousChef.getNom() + " " + previousChef.getPrenom()
                            + " (ID: " + previousChef.getId() + ")");
                }
            }

            historiqueAffectationService.save(hist);
        }

        return ResponseEntity.ok(saved.getId());
    }
}
