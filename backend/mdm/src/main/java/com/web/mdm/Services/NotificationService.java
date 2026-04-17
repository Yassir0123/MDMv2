package com.web.mdm.Services;

import com.web.mdm.Dto.NotificationDto;
import com.web.mdm.Models.Compte;
import com.web.mdm.Models.Notification;
import com.web.mdm.Models.Users;
import com.web.mdm.Repository.CompteRepository;
import com.web.mdm.Repository.NotificationRepository;
import com.web.mdm.Repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private UsersRepository usersRepository;

    public Notification createNotification(String message, Integer actorUserId, Integer targetId, Integer managerId,
            Integer targetUser) {
        return createNotification(message, actorUserId, targetId, managerId, targetUser, null);
    }

    public Notification createNotification(String message, Integer actorUserId, Integer targetId, Integer managerId,
            Integer targetUser, String eventKey) {
        if (actorUserId == null || message == null || message.isBlank()) {
            return null;
        }

        Notification notification = new Notification();
        notification.setNom(message);
        notification.setUserId(actorUserId);
        notification.setTargetId(targetId);
        notification.setManagerId(managerId);
        notification.setTargetUser(targetUser);
        notification.setEventKey(eventKey != null && !eventKey.isBlank() ? eventKey : UUID.randomUUID().toString());
        notification.setLu(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public Notification notifyAdminAssetAssignment(String assetType, String assetLabel, Integer targetUserId) {
        Integer actorUserId = getCurrentActorUserId();
        Integer managerId = resolveManagerIdForRecipient(targetUserId);
        return createNotification(buildAssetMessage("Affectation", assetType, assetLabel), actorUserId, targetUserId,
                managerId, null);
    }

    public Notification notifyAdminAssetUnassignment(String assetType, String assetLabel, Integer targetUserId) {
        Integer actorUserId = getCurrentActorUserId();
        Integer managerId = resolveManagerIdForRecipient(targetUserId);
        return createNotification(buildAssetMessage("Desaffectation", assetType, assetLabel), actorUserId, targetUserId,
                managerId, null);
    }

    public Notification notifyReceptionOrSignalementToAdmin(String actionLabel, String assetType, String assetLabel,
            Integer actedUserId, Integer targetUserId) {
        Integer actorUserId = getCurrentActorUserId();
        List<Integer> adminUserIds = findAdministrateurUserIds();
        if (adminUserIds.isEmpty()) {
            return null;
        }

        Integer managerId = resolveActorManagerId(actorUserId);
        String eventKey = UUID.randomUUID().toString();
        Notification latest = null;
        for (Integer adminUserId : adminUserIds) {
            latest = createNotification(buildAssetMessage(actionLabel, assetType, assetLabel), actorUserId,
                    adminUserId, managerId, targetUserId, eventKey);
        }
        return latest;
    }

    public Notification notifyManagementToAdmin(String actionLabel, Users affectedUser) {
        Integer actorUserId = getCurrentActorUserId();
        List<Integer> adminUserIds = findAdministrateurUserIds();
        if (actorUserId == null || affectedUser == null) {
            return null;
        }

        Notification latest = null;
        Integer managerId = resolveActorManagerId(actorUserId);
        String eventKey = UUID.randomUUID().toString();
        for (Integer adminUserId : adminUserIds) {
            latest = createNotification(buildManagementMessage(actionLabel, affectedUser), actorUserId, adminUserId,
                    managerId, null, eventKey);
        }
        if (!affectedUser.getId().equals(actorUserId)) {
            latest = createNotification(buildManagementMessage(actionLabel, affectedUser), actorUserId,
                    affectedUser.getId(), resolveManagerIdForRecipient(affectedUser.getId()), null, eventKey);
        }
        return latest;
    }

    public Notification notifyAdminManagementReaffectation(Users affectedUser) {
        return notifyAdminManagerAndUserAction("Reaffectation", affectedUser);
    }

    public Notification notifyAdminManagementAction(String actionLabel, Users affectedUser) {
        Integer actorUserId = getCurrentActorUserId();
        if (affectedUser == null) {
            return null;
        }

        return createNotification(buildManagementMessage(actionLabel, affectedUser), actorUserId, affectedUser.getId(),
                resolveManagerIdForRecipient(affectedUser.getId()), null);
    }

    public Notification notifyAdminManagerAndUserAction(String actionLabel, Users affectedUser) {
        Integer actorUserId = getCurrentActorUserId();
        if (affectedUser == null) {
            return null;
        }

        Integer targetId = affectedUser.getManagerId() != null && affectedUser.getManagerId() > 0
                ? affectedUser.getManagerId()
                : affectedUser.getId();

        return createNotification(buildManagementMessage(actionLabel, affectedUser), actorUserId, targetId,
                resolveManagerIdForRecipient(affectedUser.getId()), affectedUser.getId());
    }

    public Notification notifyAdminFinalDesactivation(Users affectedUser) {
        return notifyAdminManagerAndUserAction("Desactivation", affectedUser);
    }

    public Notification notifyAdminReactivation(Users affectedUser) {
        return notifyAdminManagerAndUserAction("Reactivation", affectedUser);
    }

    public List<NotificationDto> getMyNotifications() {
        Compte compte = getCurrentCompte();
        if (compte == null || compte.getUser() == null) {
            return List.of();
        }

        Integer currentUserId = compte.getUser().getId();
        List<Notification> notifications;
        if (compte.getCompteType() == Compte.CompteType.Administrateur) {
            notifications = notificationRepository.findAdminNotifications(currentUserId);
        } else if (compte.getCompteType() == Compte.CompteType.Manager) {
            notifications = notificationRepository.findManagerNotifications(currentUserId);
        } else {
            notifications = notificationRepository.findAgentNotifications(currentUserId);
        }

        if (compte.getCompteType() == Compte.CompteType.Administrateur) {
            return notifications.stream().map(notification -> toDto(notification, 1, Boolean.TRUE.equals(notification.getLu()))).toList();
        }

        return collapseNotifications(notifications).stream()
                .map(group -> toDto(group.notification(), group.groupedCopies(), group.read()))
                .toList();
    }

    @Transactional
    public void markAsRead(Integer id) {
        Notification notification = getAccessibleNotification(id);
        notification.setLu(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        List<Notification> notifications = getVisibleNotifications();
        for (Notification notification : notifications) {
            if (!Boolean.TRUE.equals(notification.getLu())) {
                notification.setLu(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void delete(Integer id) {
        Notification notification = getAccessibleNotification(id);
        notificationRepository.delete(notification);
    }

    public Integer countUnreadForCurrentUser() {
        Compte compte = getCurrentCompte();
        List<Notification> notifications = getVisibleNotifications();
        if (compte == null || compte.getUser() == null) {
            return 0;
        }
        if (compte.getCompteType() == Compte.CompteType.Administrateur) {
            return (int) notifications.stream().filter(n -> !Boolean.TRUE.equals(n.getLu())).count();
        }
        return (int) collapseNotifications(notifications).stream().filter(group -> !group.read()).count();
    }

    private Notification getAccessibleNotification(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        Integer notificationId = notification.getId();
        boolean accessible = getVisibleNotifications().stream().anyMatch(item -> item.getId().equals(notificationId));
        if (!accessible) {
            throw new RuntimeException("Notification not accessible");
        }
        return notification;
    }

    private List<Notification> getVisibleNotifications() {
        Compte compte = getCurrentCompte();
        if (compte == null || compte.getUser() == null) {
            return List.of();
        }

        Integer currentUserId = compte.getUser().getId();
        if (compte.getCompteType() == Compte.CompteType.Administrateur) {
            return notificationRepository.findAdminNotifications(currentUserId);
        }
        if (compte.getCompteType() == Compte.CompteType.Manager) {
            return notificationRepository.findManagerNotifications(currentUserId);
        }
        return notificationRepository.findAgentNotifications(currentUserId);
    }

    private NotificationDto toDto(Notification notification, Integer groupedCopies, Boolean readState) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setNom(notification.getNom());
        dto.setUserId(notification.getUserId());
        dto.setTargetId(notification.getTargetId());
        dto.setManagerId(notification.getManagerId());
        dto.setTargetUser(notification.getTargetUser());
        dto.setEventKey(notification.getEventKey());
        dto.setGroupedCopies(groupedCopies);
        dto.setLu(readState);
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setActorName(resolveUserName(notification.getUserId()));
        dto.setTargetName(resolveUserName(notification.getTargetId()));
        dto.setManagerName(resolveUserName(notification.getManagerId()));
        dto.setTargetUserName(resolveUserName(notification.getTargetUser()));
        return dto;
    }

    private List<NotificationGroup> collapseNotifications(List<Notification> notifications) {
        LinkedHashMap<String, NotificationGroup> grouped = new LinkedHashMap<>();
        for (Notification notification : notifications) {
            String key = resolveGroupKey(notification);
            NotificationGroup existing = grouped.get(key);
            if (existing == null) {
                grouped.put(key, new NotificationGroup(notification, 1, Boolean.TRUE.equals(notification.getLu())));
            } else {
                grouped.put(key, new NotificationGroup(
                        existing.notification(),
                        existing.groupedCopies() + 1,
                        existing.read() || Boolean.TRUE.equals(notification.getLu())));
            }
        }
        return grouped.values().stream().toList();
    }

    private String resolveGroupKey(Notification notification) {
        if (notification.getEventKey() != null && !notification.getEventKey().isBlank()) {
            return notification.getEventKey();
        }
        return String.join("|",
                notification.getNom() != null ? notification.getNom() : "",
                String.valueOf(notification.getUserId()),
                String.valueOf(notification.getManagerId()),
                String.valueOf(notification.getTargetUser()),
                notification.getCreatedAt() != null ? notification.getCreatedAt().withNano(0).toString() : "");
    }

    private String resolveUserName(Integer userId) {
        if (userId == null) {
            return null;
        }
        Optional<Users> user = usersRepository.findById(userId);
        return user.map(value -> {
            String nom = value.getNom() != null ? value.getNom().trim() : "";
            String prenom = value.getPrenom() != null ? value.getPrenom().trim() : "";
            String fullName = (nom + " " + prenom).trim();
            return fullName.isEmpty() ? "Utilisateur #" + value.getId() : fullName;
        }).orElse("Utilisateur #" + userId);
    }

    private String buildAssetMessage(String actionLabel, String assetType, String assetLabel) {
        return actionLabel + " " + safeLabel(assetType) + " : " + safeLabel(assetLabel);
    }

    private String buildManagementMessage(String actionLabel, Users user) {
        return actionLabel + " utilisateur : " + resolveUserName(user.getId());
    }

    private String safeLabel(String value) {
        return value == null || value.isBlank() ? "Element" : value.trim();
    }

    public Integer getCurrentActorUserId() {
        Compte compte = getCurrentCompte();
        return compte != null && compte.getUser() != null ? compte.getUser().getId() : null;
    }

    private Compte getCurrentCompte() {
        String login = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (login == null || login.isBlank()) {
            return null;
        }
        return compteRepository.findByLogin(login).orElse(null);
    }

    private Integer resolveManagerIdForRecipient(Integer targetUserId) {
        if (targetUserId == null) {
            return null;
        }

        Optional<Compte> compte = compteRepository.findFirstByUser_Id(targetUserId);
        if (compte.isPresent()) {
            Compte.CompteType type = compte.get().getCompteType();
            if (type == Compte.CompteType.Agent || type == Compte.CompteType.HR) {
                return usersRepository.findById(targetUserId).map(Users::getManagerId).orElse(null);
            }
        }
        return null;
    }

    private Integer resolveActorManagerId(Integer actorUserId) {
        if (actorUserId == null) {
            return null;
        }
        return usersRepository.findById(actorUserId).map(Users::getManagerId).orElse(null);
    }

    private List<Integer> findAdministrateurUserIds() {
        return compteRepository.findByCompteType(Compte.CompteType.Administrateur).stream()
                .map(Compte::getUser)
                .filter(user -> user != null && user.getId() != null)
                .map(Users::getId)
                .distinct()
                .toList();
    }

    private record NotificationGroup(Notification notification, Integer groupedCopies, Boolean read) {
    }
}
