package com.web.mdm.Controllers;

import com.web.mdm.Models.HistoriqueAffectation;
import com.web.mdm.Services.HistoriqueAffectationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historique-affectation")
@CrossOrigin(origins = "*")
public class HistoriqueAffectationController {

    private final HistoriqueAffectationService service;

    public HistoriqueAffectationController(HistoriqueAffectationService service) {
        this.service = service;
    }

    @GetMapping
    public List<HistoriqueAffectation> getAll() {
        return service.getAll();
    }

    @GetMapping("/agence/{agenceId}")
    public List<HistoriqueAffectation> getByAgence(@PathVariable Integer agenceId) {
        return service.getByAgenceId(agenceId);
    }

    @GetMapping("/entrepot/{entrepotId}")
    public List<HistoriqueAffectation> getByEntrepot(@PathVariable Integer entrepotId) {
        return service.getByEntrepotId(entrepotId);
    }

    @GetMapping("/departement/{departementId}")
    public List<HistoriqueAffectation> getByDepartement(@PathVariable Integer departementId) {
        return service.getByDepartementId(departementId);
    }

    @GetMapping("/user/{userId}")
    public List<HistoriqueAffectation> getByUser(@PathVariable Integer userId) {
        return service.getByUserId(userId);
    }
}
