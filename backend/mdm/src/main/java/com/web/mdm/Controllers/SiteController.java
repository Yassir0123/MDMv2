package com.web.mdm.Controllers;

import com.web.mdm.Models.Site;
import com.web.mdm.Services.SiteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
@CrossOrigin(origins = "*")
public class SiteController {
    @Autowired private SiteService siteService;

    @GetMapping
    public List<Site> getAll() { return siteService.getAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Site s) {
        Site saved = siteService.save(s);
        return ResponseEntity.ok(saved.getId());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Site payload) {
        Site existing = siteService.getById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        existing.setLibeller(payload.getLibeller());
        siteService.save(existing);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) { siteService.delete(id); }
}

