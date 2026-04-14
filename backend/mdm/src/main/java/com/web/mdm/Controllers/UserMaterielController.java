package com.web.mdm.Controllers;

import com.web.mdm.Models.Materiel;
import com.web.mdm.Repository.MaterielRepository;
import com.web.mdm.Services.UserMaterielService;
import com.web.mdm.Models.Users;
import com.web.mdm.Models.Compte;
import com.web.mdm.Repository.CompteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-materiel")
@CrossOrigin(origins = "*")
public class UserMaterielController {

    @Autowired
    private MaterielRepository repository;
    @Autowired
    private UserMaterielService service;
    @Autowired
    private CompteRepository compteRepository;

    @GetMapping("/my-assets")
    public List<Materiel> getMyAssets() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Compte account = compteRepository.findByLogin(email).orElse(null);

        if (account == null || account.getUser() == null) {
            return List.of();
        }

        Integer userId = account.getUser().getId();

        // Fetch items assigned to this user with status 'affecter' or 'annuler'
        // We filter manually or via custom query. Custom query is better but stream is
        // okay for now.
        return repository.findAll().stream()
                .filter(m -> m.getAffectedUser() != null && m.getAffectedUser().getId().equals(userId))
                .filter(m -> "affecter".equalsIgnoreCase(m.getStatusAffectation())
                        || "annuler".equalsIgnoreCase(m.getStatusAffectation())
                        || "recu".equalsIgnoreCase(m.getStatusAffectation())) // Added 'recu' so they can see what they
                                                                              // have confirmed too
                .collect(Collectors.toList());
    }

    @PostMapping("/confirm/{id}")
    public ResponseEntity<?> confirm(@PathVariable Integer id) {
        service.confirmReception(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{id}")
    public ResponseEntity<?> report(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String motif = body.get("motif");
        String commentaire = body.getOrDefault("commentaire", null);
        service.reportIssue(id, motif, commentaire);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/cancelled")
    public List<Materiel> getCancelledAssets() {
        // Fetch all assets where status is "annuler"
        return repository.findAll().stream()
                .filter(m -> "annuler".equalsIgnoreCase(m.getStatusAffectation()))
                .collect(Collectors.toList());
    }

    @PostMapping("/retry/{id}")
    public ResponseEntity<?> retry(@PathVariable Integer id) {
        service.retryAssignment(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset/{id}")
    public ResponseEntity<?> reset(@PathVariable Integer id) {
        service.resetAssignment(id);
        return ResponseEntity.ok().build();
    }
}