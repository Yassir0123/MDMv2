package com.web.mdm.Controllers;

import com.web.mdm.Models.*;
import com.web.mdm.Repository.*;
import com.web.mdm.Services.SubordinateMaterielService;
import com.web.mdm.Services.HistoryAdminStampService;
import com.web.mdm.Services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/subordinates")
@CrossOrigin(origins = "*")
public class SubordinatesController {

    private final UsersRepository usersRepository;
    private final MaterielRepository materielRepository;
    private final HistoriqueAffectationRepository historiqueAffectationRepository;
    private final AgenceRepository agenceRepository;
    private final DepartementRepository departementRepository;
    private final EntrepotRepository entrepotRepository;
    private final SubordinateMaterielService subordinateMaterielService;
    private final NotificationService notificationService;
    private final HistoryAdminStampService historyAdminStampService;

    public SubordinatesController(
            UsersRepository usersRepository,
            MaterielRepository materielRepository,
            HistoriqueAffectationRepository historiqueAffectationRepository,
            AgenceRepository agenceRepository,
            DepartementRepository departementRepository,
            EntrepotRepository entrepotRepository,
            SubordinateMaterielService subordinateMaterielService,
            NotificationService notificationService,
            HistoryAdminStampService historyAdminStampService) {
        this.usersRepository = usersRepository;
        this.materielRepository = materielRepository;
        this.historiqueAffectationRepository = historiqueAffectationRepository;
        this.agenceRepository = agenceRepository;
        this.departementRepository = departementRepository;
        this.entrepotRepository = entrepotRepository;
        this.subordinateMaterielService = subordinateMaterielService;
        this.notificationService = notificationService;
        this.historyAdminStampService = historyAdminStampService;
    }

    // --- GET subordinates for a manager ---
    @GetMapping
    public List<Users> getSubordinates(@RequestParam Integer managerId) {
        return usersRepository.findByManagerId(managerId);
    }

    // --- GET pending (affecter) materiel for a user ---
    @GetMapping("/{userId}/materiel/pending")
    public List<Materiel> getPendingMateriel(@PathVariable Integer userId) {
        return materielRepository.findByAffectedUserIdAndStatusAffectation(userId, "affecter");
    }

    // --- GET all materiel for a user (for voir detail) ---
    @GetMapping("/{userId}/materiel/all")
    public List<Materiel> getAllMateriel(@PathVariable Integer userId) {
        return materielRepository.findByAffectedUserId(userId);
    }

    // --- ACCUSER reception ---
    @PutMapping("/{userId}/materiel/{materielId}/accuser")
    @Transactional
    public ResponseEntity<Materiel> accuserReception(
            @PathVariable Integer userId,
            @PathVariable Integer materielId) {
        Optional<Materiel> opt = materielRepository.findById(materielId);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(subordinateMaterielService.confirmReception(materielId));
    }

    // --- ANNULER affectation ---
    @PutMapping("/{userId}/materiel/{materielId}/annuler")
    @Transactional
    public ResponseEntity<Materiel> annulerAffectation(
            @PathVariable Integer userId,
            @PathVariable Integer materielId,
            @RequestBody Map<String, String> body) {
        Optional<Materiel> opt = materielRepository.findById(materielId);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        String motif = body != null ? body.get("motif") : null;
        String commentaire = body != null ? body.get("commentaire") : null;
        return ResponseEntity.ok(subordinateMaterielService.annulerAffectation(materielId, motif, commentaire));


    }

    // --- DETACH user ---
    @PostMapping("/{userId}/detach")
    @Transactional
    public ResponseEntity<Users> detachUser(
            @PathVariable Integer userId,
            @RequestBody(required = false) Map<String, Object> body) {
        Optional<Users> optUser = usersRepository.findById(userId);
        if (optUser.isEmpty())
            return ResponseEntity.notFound().build();

        Users user = optUser.get();
        Integer managerId = body != null && body.get("managerId") != null
                ? Integer.parseInt(body.get("managerId").toString())
                : null;
        String motif = body != null && body.get("motif") != null ? body.get("motif").toString() : "Changement de poste";

        // Build historique
        HistoriqueAffectation hist = buildHistorique(user, "dettacher", motif, managerId);
        historiqueAffectationRepository.save(historyAdminStampService.stamp(hist));

        // Update user status
        user.setStatus(Users.UserStatus.detacher);
        user.setDateDetacher(LocalDateTime.now());
        Users saved = usersRepository.save(user);
        notificationService.notifyManagementToAdmin("Dettacher", saved);
        return ResponseEntity.ok(saved);
    }

    // --- DESACTIVER user ---
    @PostMapping("/{userId}/desactiver")
    @Transactional
    public ResponseEntity<Users> desactiverUser(
            @PathVariable Integer userId,
            @RequestBody Map<String, Object> body) {
        Optional<Users> optUser = usersRepository.findById(userId);
        if (optUser.isEmpty())
            return ResponseEntity.notFound().build();

        Users user = optUser.get();
        String motif = body != null && body.get("motif") != null ? body.get("motif").toString() : null;
        Integer managerId = body != null && body.get("managerId") != null
                ? Integer.parseInt(body.get("managerId").toString())
                : null;

        // Build historique
        HistoriqueAffectation hist = buildHistorique(user, "desactiver", motif, managerId);
        historiqueAffectationRepository.save(historyAdminStampService.stamp(hist));

        // Update user status
        user.setStatus(Users.UserStatus.desactiver);
        user.setDateDesactiver(LocalDateTime.now());
        Users saved = usersRepository.save(user);
        notificationService.notifyManagementToAdmin("Desactivation", saved);
        return ResponseEntity.ok(saved);
    }

    // --- Helper: build HistoriqueAffectation from user ---
    private HistoriqueAffectation buildHistorique(Users user, String statusEvent, String motif, Integer managerId) {
        HistoriqueAffectation hist = new HistoriqueAffectation();

        hist.setUser(user);
        hist.setUserNom(user.getNom());
        hist.setUserPrenom(user.getPrenom());
        hist.setUserMatricule(user.getMatricule());
        hist.setUserTel(user.getTel());
        hist.setUserCin(user.getCin());
        hist.setUserAddress(user.getAddress());
        hist.setUserStatus(user.getStatus() != null ? user.getStatus().name() : null);
        hist.setStatusEvent(statusEvent);
        hist.setDateEvent(LocalDateTime.now());
        hist.setMotif(motif);
        hist.setManagerId(managerId);

        // Agence
        if (user.getAgence() != null) {
            hist.setAgence(user.getAgence());
            hist.setAgenceNom(user.getAgence().getNom());
            hist.setAgenceEmail(user.getAgence().getEmail());
            hist.setAgenceTel(user.getAgence().getTel());
            // Chef agence
            if (user.getAgence().getChefAgence() != null) {
                hist.setChefAgenceId(user.getAgence().getChefAgence().getId());
            }
        }

        // Departement
        if (user.getDepartement() != null) {
            hist.setDepartement(user.getDepartement());
            hist.setDepartmentNom(user.getDepartement().getNom());
            hist.setDepartmentEffective(user.getDepartement().getEffective());
            // Chef departement
            if (user.getDepartement().getChefDepartment() != null) {
                hist.setChefDepartementId(user.getDepartement().getChefDepartment().getId());
            }
        }

        // Entrepot
        if (user.getEntrepot() != null) {
            hist.setEntrepot(user.getEntrepot());
            hist.setEntrepotNom(
                    user.getEntrepot().getSiteRef() != null ? user.getEntrepot().getSiteRef().getLibeller() : null);// Chef
                                                                                                                    // entrepot
            if (user.getEntrepot().getChefEntrepot() != null) {
                hist.setChefEntrepotId(user.getEntrepot().getChefEntrepot().getId());
            }
        }

        return hist;
    }
}
