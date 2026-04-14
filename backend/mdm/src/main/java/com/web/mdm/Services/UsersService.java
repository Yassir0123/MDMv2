package com.web.mdm.Services;

import com.web.mdm.Models.*;
import com.web.mdm.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class UsersService {

    @Autowired
    private UsersRepository usersRepository;
    @Autowired
    private MaterielRepository materielRepository;
    @Autowired
    private MaterielsService materielsService;
    @Autowired
    private CarteSimService carteSimService;
    @Autowired
    private MobileService mobileService;
    @Autowired
    private HistoriqueAffectationRepository historiqueAffectationRepository;
    @Autowired
    private DepartementRepository departementRepository;
    @Autowired
    private AgenceRepository agenceRepository;
    @Autowired
    private EntrepotRepository entrepotRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private CompteRepository compteRepository;

    public List<Users> getAll() {
        return usersRepository.findAllWithAssociations();
    }

    public List<Users> getManagementUsers() {
        return usersRepository.findAllWithAssociations();
    }

    public Optional<Users> getById(Integer id) {
        return usersRepository.findById(id);
    }

    public Users save(Users user) {
        return usersRepository.save(user);
    }

    public void delete(Integer id) {
        usersRepository.deleteById(id);
    }

    @Transactional
    public Users detacherUser(Integer userId, String motif, Integer managerId) {
        Users user = usersRepository.findById(userId).orElseThrow();

        HistoriqueAffectation hist = buildHistorique(user, "dettacher", motif, managerId);
        historiqueAffectationRepository.save(hist);

        user.setStatus(Users.UserStatus.detacher);
        user.setDateDetacher(LocalDate.now());
        Users saved = usersRepository.save(user);
        notificationService.notifyAdminManagementAction("Dettacher", saved);
        return saved;
    }

    @Transactional
    public Users desactiverUser(Integer userId, String motif, Integer managerId) {
        Users user = usersRepository.findById(userId).orElseThrow();

        // 1. Log HistoriqueAffectation
        HistoriqueAffectation hist = buildHistorique(user, "desactiver", motif, managerId);
        historiqueAffectationRepository.save(hist);

        // 2. Unassign all materials
        List<Materiel> materiels = materielRepository.findByAffectedUserId(userId);
        for (Materiel m : materiels) {
            String type = m.getTypeMateriel() != null ? m.getTypeMateriel().toLowerCase() : "";
            if (type.contains("carte sim") || type.contains("cartesim")) {
                carteSimService.unassign(m.getSpecificId());
            } else if (type.contains("mobile") || type.contains("smartphone") || type.contains("tablette")) {
                mobileService.unassign(m.getSpecificId());
            } else {
                materielsService.unassign(m.getSpecificId());
            }
        }

        // 3. Update user to archived and nullify organizations
        user.setStatus(Users.UserStatus.archived);
        user.setDateDesactiver(LocalDate.now());
        user.setDateSortie(LocalDate.now());
        user.setAgence(null);
        user.setDepartement(null);
        user.setEntrepot(null);
        Users saved = usersRepository.save(user);
        notificationService.notifyAdminFinalDesactivation(saved);
        return saved;
    }

    @Transactional
    public Users reaffecterUser(Integer userId, Boolean updateOrg, Integer departementId, Integer agenceId,
            Integer entrepotId, Boolean updateManager, Integer managerId) {
        Users user = usersRepository.findById(userId).orElseThrow();

        if (updateOrg != null && updateOrg) {
            if (departementId != null && departementId == -1) {
                // Ignore updating this field
            } else if (departementId != null) {
                user.setDepartement(departementRepository.findById(departementId).orElse(null));
            } else {
                user.setDepartement(null);
            }

            if (agenceId != null && agenceId == -1) {
                // Ignore updating this field
            } else if (agenceId != null) {
                user.setAgence(agenceRepository.findById(agenceId).orElse(null));
            } else {
                user.setAgence(null);
            }

            if (entrepotId != null && entrepotId == -1) {
                // Ignore updating this field
            } else if (entrepotId != null) {
                user.setEntrepot(entrepotRepository.findById(entrepotId).orElse(null));
            } else {
                user.setEntrepot(null);
            }
        }

        if (updateManager != null && updateManager) {
            if (managerId != null && managerId == -1) {
                // Ignore updating this field
            } else {
                user.setManagerId(managerId);
            }
        }

        user.setStatus(Users.UserStatus.active);

        HistoriqueAffectation hist = buildHistorique(user, "reaffectation", "Réaffectation", managerId);
        historiqueAffectationRepository.save(hist);

        Users saved = usersRepository.save(user);
        notificationService.notifyAdminManagementReaffectation(saved);
        return saved;
    }

    @Transactional
    public Users activerUser(Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        user.setStatus(Users.UserStatus.active);
        user.setDateDesactiver(null);
        user.setDateSortie(null);
        for (Compte compte : compteRepository.findByUser_Id(userId)) {
            compte.setStatus(Compte.CompteStatus.active);
        }
        Users saved = usersRepository.save(user);
        notificationService.notifyAdminReactivation(saved);
        return saved;
    }

    private Integer resolveManagerId(Integer managerId, Users user) {
        Integer candidate = managerId;
        if (candidate == null || candidate <= 0) {
            candidate = user.getManagerId();
        }
        if (candidate == null || candidate <= 0) {
            return null;
        }
        if (!usersRepository.existsById(candidate)) {
            return null;
        }
        return candidate;
    }

    // Helper: build HistoriqueAffectation from user
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
        hist.setDateEvent(LocalDate.now());
        hist.setMotif(motif);
        hist.setManagerId(resolveManagerId(managerId, user));

        if (user.getAgence() != null) {
            hist.setAgence(user.getAgence());
            hist.setAgenceNom(user.getAgence().getNom());
            hist.setAgenceEmail(user.getAgence().getEmail());
            hist.setAgenceTel(user.getAgence().getTel());
            if (user.getAgence().getChefAgence() != null) {
                hist.setChefAgenceId(user.getAgence().getChefAgence().getId());
            }
        }

        if (user.getDepartement() != null) {
            hist.setDepartement(user.getDepartement());
            hist.setDepartmentNom(user.getDepartement().getNom());
            hist.setDepartmentEffective(user.getDepartement().getEffective());
            if (user.getDepartement().getChefDepartment() != null) {
                hist.setChefDepartementId(user.getDepartement().getChefDepartment().getId());
            }
        }

        if (user.getEntrepot() != null) {
            hist.setEntrepot(user.getEntrepot());
            hist.setEntrepotNom(
                    user.getEntrepot().getSiteRef() != null ? user.getEntrepot().getSiteRef().getLibeller() : null);
            if (user.getEntrepot().getChefEntrepot() != null) {
                hist.setChefEntrepotId(user.getEntrepot().getChefEntrepot().getId());
            }
        }

        return hist;
    }
}
