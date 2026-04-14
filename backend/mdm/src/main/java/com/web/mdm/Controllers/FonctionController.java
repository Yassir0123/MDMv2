package com.web.mdm.Controllers;

import com.web.mdm.Models.Fonction;
import com.web.mdm.Services.FonctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fonctions")
@CrossOrigin(origins = "*")
public class FonctionController {

    private final FonctionService fonctionService;

    // Constructor injection (Best Practice)
    @Autowired 
    public FonctionController(FonctionService fonctionService) {
        this.fonctionService = fonctionService;
    }

    @GetMapping
    public List<Fonction> getAll() { 
        return fonctionService.getAll(); 
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Fonction f) {
        Fonction saved = fonctionService.save(f);
        return ResponseEntity.ok(saved.getId());
    }

    @PutMapping("/{id}")
    // CHANGED: @PathVariable Integer id -> @PathVariable String id
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Fonction payload) {
        Fonction existing = fonctionService.getById(id).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        
        existing.setNom(payload.getNom());
        fonctionService.save(existing);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    // CHANGED: @PathVariable Integer id -> @PathVariable String id
    public void delete(@PathVariable String id) { 
        fonctionService.delete(id); 
    }
}