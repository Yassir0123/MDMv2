package com.web.mdm.Services;

import com.web.mdm.Models.AdminTrackedHistory;
import com.web.mdm.Models.Compte;
import com.web.mdm.Models.ManagerTrackedHistory;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.UsersRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class HistoryAdminStampService {
    private final CompteRepository compteRepository;
    private final UsersRepository usersRepository;

    public HistoryAdminStampService(CompteRepository compteRepository, UsersRepository usersRepository) {
        this.compteRepository = compteRepository;
        this.usersRepository = usersRepository;
    }

    public Integer getCurrentAdminId() {
        String login = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (login == null || login.isBlank()) {
            return null;
        }
        Compte compte = compteRepository.findByLogin(login).orElse(null);
        if (compte == null || compte.getCompteType() != Compte.CompteType.Administrateur || compte.getUser() == null) {
            return null;
        }
        return compte.getUser().getId();
    }

    public <T extends AdminTrackedHistory> T stamp(T history) {
        if (history != null) {
            history.setAdminId(getCurrentAdminId());
            if (history instanceof ManagerTrackedHistory managerTrackedHistory) {
                managerTrackedHistory.setManagerId(resolveTargetManagerId(managerTrackedHistory.resolveTargetUserId()));
            }
        }
        return history;
    }

    private Integer resolveTargetManagerId(Integer targetUserId) {
        if (targetUserId == null || targetUserId <= 0) {
            return null;
        }
        return usersRepository.findById(targetUserId)
                .map(user -> user.getManagerId() != null && user.getManagerId() > 0 ? user.getManagerId() : null)
                .orElse(null);
    }
}
