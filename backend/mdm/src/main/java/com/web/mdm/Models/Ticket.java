package com.web.mdm.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.nouveau;

    @Column(nullable = false)
    private String subject;

    @Enumerated(EnumType.STRING)
    private TicketLevel importance;

    @Enumerated(EnumType.STRING)
    private TicketLevel impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketFlag flag = TicketFlag.NONE;

    @Column(name = "date_sent", nullable = false)
    private LocalDateTime dateSent;

    @Column(name = "sous_category_id")
    private Integer sousCategoryId;

    @Column(name = "localisation")
    private String localisation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketType type;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private Users sender;

    @ManyToOne
    @JoinColumn(name = "applier_id")
    private Users applier;

    @Column(name = "applier_id", insertable = false, updatable = false)
    private Integer applierIdValue;

    @Column(name = "close_delay")
    private Integer closeDelay = 7;

    public enum TicketStatus {
        nouveau,
        en_attente,
        en_progress,
        resolu,
        clos
    }

    public enum TicketLevel {
        low,
        medium,
        high
    }

    public enum TicketFlag {
        NONE,
        MID,
        HIGH
    }

    public enum TicketType {
        incident,
        demande
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public TicketLevel getImportance() {
        return importance;
    }

    public void setImportance(TicketLevel importance) {
        this.importance = importance;
    }

    public TicketLevel getImpact() {
        return impact;
    }

    public void setImpact(TicketLevel impact) {
        this.impact = impact;
    }

    public TicketFlag getFlag() {
        return flag;
    }

    public void setFlag(TicketFlag flag) {
        this.flag = flag;
    }

    public LocalDateTime getDateSent() {
        return dateSent;
    }

    public void setDateSent(LocalDateTime dateSent) {
        this.dateSent = dateSent;
    }

    public Integer getSousCategoryId() {
        return sousCategoryId;
    }

    public void setSousCategoryId(Integer sousCategoryId) {
        this.sousCategoryId = sousCategoryId;
    }

    public String getLocalisation() {
        return localisation;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public TicketType getType() {
        return type;
    }

    public void setType(TicketType type) {
        this.type = type;
    }

    public Users getSender() {
        return sender;
    }

    public void setSender(Users sender) {
        this.sender = sender;
    }

    public Users getApplier() {
        return applier;
    }

    public void setApplier(Users applier) {
        this.applier = applier;
    }

    public Integer getApplierIdValue() {
        return applierIdValue;
    }

    public void setApplierIdValue(Integer applierIdValue) {
        this.applierIdValue = applierIdValue;
    }

    public Integer getCloseDelay() {
        return closeDelay;
    }

    public void setCloseDelay(Integer closeDelay) {
        this.closeDelay = closeDelay;
    }
}
