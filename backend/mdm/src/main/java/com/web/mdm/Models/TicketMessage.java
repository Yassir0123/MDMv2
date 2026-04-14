package com.web.mdm.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_message")
public class TicketMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Lob
    @Column(nullable = false)
    private String body;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private Users sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private Users receiver;

    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_sent", nullable = false)
    private MessageDeliveryStatus statusSent = MessageDeliveryStatus.sent;

    @Column(nullable = false)
    private Integer replied = 0;

    @Column(name = "latest_date", nullable = false)
    private LocalDateTime latestDate;

    public enum MessageDeliveryStatus {
        sent,
        pending
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Ticket getTicket() {
        return ticket;
    }

    public void setTicket(Ticket ticket) {
        this.ticket = ticket;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Users getSender() {
        return sender;
    }

    public void setSender(Users sender) {
        this.sender = sender;
    }

    public Users getReceiver() {
        return receiver;
    }

    public void setReceiver(Users receiver) {
        this.receiver = receiver;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public MessageDeliveryStatus getStatusSent() {
        return statusSent;
    }

    public void setStatusSent(MessageDeliveryStatus statusSent) {
        this.statusSent = statusSent;
    }

    public Integer getReplied() {
        return replied;
    }

    public void setReplied(Integer replied) {
        this.replied = replied;
    }

    public LocalDateTime getLatestDate() {
        return latestDate;
    }

    public void setLatestDate(LocalDateTime latestDate) {
        this.latestDate = latestDate;
    }
}
