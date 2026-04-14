package com.web.mdm.Controllers;

import com.web.mdm.Models.Entrepot;
import com.web.mdm.Services.EntrepotService;
import com.web.mdm.Services.SiteService;
import com.web.mdm.Services.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entrepots")
@CrossOrigin(origins = "*")
public class EntrepotController {
    @Autowired private EntrepotService entrepotService;
    @Autowired private SiteService siteService;
    @Autowired private UsersService usersService;

    @GetMapping
    public List<Entrepot> getAll() { return entrepotService.getAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Entrepot payload) {
        // Allow passing only IDs for relations from frontend
        if (payload.getSiteRef() != null && payload.getSiteRef().getId() != null) {
            payload.setSiteRef(siteService.getById(payload.getSiteRef().getId()).orElse(null));
        }
        if (payload.getChefEntrepot() != null && payload.getChefEntrepot().getId() != null) {
            payload.setChefEntrepot(usersService.getById(payload.getChefEntrepot().getId()).orElse(null));
        }
        Entrepot saved = entrepotService.save(payload);
        return ResponseEntity.ok(saved.getId());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Entrepot payload) {
        Entrepot existing = entrepotService.getById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();

        existing.setTelephone(payload.getTelephone());
        existing.setEmail(payload.getEmail());
        existing.setFax(payload.getFax());

        if (payload.getSiteRef() != null && payload.getSiteRef().getId() != null) {
            existing.setSiteRef(siteService.getById(payload.getSiteRef().getId()).orElse(null));
        }
        if (payload.getChefEntrepot() != null && payload.getChefEntrepot().getId() != null) {
            existing.setChefEntrepot(usersService.getById(payload.getChefEntrepot().getId()).orElse(null));
        }

        entrepotService.save(existing);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { entrepotService.delete(id); }
}

