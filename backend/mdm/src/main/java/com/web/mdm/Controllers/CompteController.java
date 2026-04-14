package com.web.mdm.Controllers;

import com.web.mdm.Models.Compte;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.UsersRepository;
import com.web.mdm.Services.CompteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/comptes")
@CrossOrigin(origins = "*")
public class CompteController {

    private final CompteService compteService;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    public CompteController(CompteService compteService, UsersRepository usersRepository, PasswordEncoder passwordEncoder) {
        this.compteService = compteService;
        this.usersRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<Compte> getAllComptes() {
        return compteService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Compte> getCompteById(@PathVariable Integer id) {
        Optional<Compte> compte = compteService.getById(id);
        return compte.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Compte createCompte(@RequestBody Compte compte) {
        if (compte.getPassword() == null || compte.getPassword().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        compte.setPassword(passwordEncoder.encode(compte.getPassword()));
        Integer targetUserId = null;
        if (compte.getUser() != null && compte.getUser().getId() != null) {
            targetUserId = compte.getUser().getId();
        } else if (compte.getUserId() != null) {
            targetUserId = compte.getUserId();
        }
        if (targetUserId != null) {
            Users linkedUser = usersRepository.findById(targetUserId).orElse(null);
            compte.setUser(linkedUser);
        } else {
            compte.setUser(null);
        }
        return compteService.save(compte);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Compte> updateCompte(@PathVariable Integer id, @RequestBody Compte compteDetails) {
        Optional<Compte> optionalCompte = compteService.getById(id);
        if (optionalCompte.isPresent()) {
            Compte existingCompte = optionalCompte.get();
            existingCompte.setLogin(compteDetails.getLogin());
            if (compteDetails.getPassword() != null && !compteDetails.getPassword().isEmpty()) {
                existingCompte.setPassword(passwordEncoder.encode(compteDetails.getPassword()));
            }
            if (compteDetails.getStatus() != null) {
                existingCompte.setStatus(compteDetails.getStatus());
            }
            if (compteDetails.getCompteType() != null) {
                existingCompte.setCompteType(compteDetails.getCompteType());
            }
            if (compteDetails.getUser() != null || compteDetails.getUserId() != null) {
                Integer targetUserId = null;
                if (compteDetails.getUser() != null && compteDetails.getUser().getId() != null) {
                    targetUserId = compteDetails.getUser().getId();
                } else if (compteDetails.getUserId() != null) {
                    targetUserId = compteDetails.getUserId();
                }
                if (targetUserId != null) {
                    Users linkedUser = usersRepository.findById(targetUserId).orElse(null);
                    existingCompte.setUser(linkedUser);
                } else {
                    existingCompte.setUser(null); // Allows unassigning
                }
            }
            return ResponseEntity.ok(compteService.save(existingCompte));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompte(@PathVariable Integer id) {
        Optional<Compte> optionalCompte = compteService.getById(id);
        if (optionalCompte.isPresent()) {
            compteService.delete(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
