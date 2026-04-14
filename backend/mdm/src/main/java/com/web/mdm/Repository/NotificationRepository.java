package com.web.mdm.Repository;

import com.web.mdm.Models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @Query("""
           SELECT n
           FROM Notification n
           WHERE n.targetId = :userId
             AND (n.targetUser IS NULL OR n.targetUser = :userId)
           ORDER BY n.createdAt DESC
           """)
    List<Notification> findAdminNotifications(@Param("userId") Integer userId);

    @Query("""
           SELECT DISTINCT n
           FROM Notification n
           WHERE n.targetId = :userId OR n.managerId = :userId OR n.targetUser = :userId
           ORDER BY n.createdAt DESC
           """)
    List<Notification> findManagerNotifications(@Param("userId") Integer userId);

    @Query("""
           SELECT DISTINCT n
           FROM Notification n
           WHERE n.targetId = :userId OR n.targetUser = :userId
           ORDER BY n.createdAt DESC
           """)
    List<Notification> findAgentNotifications(@Param("userId") Integer userId);
}
