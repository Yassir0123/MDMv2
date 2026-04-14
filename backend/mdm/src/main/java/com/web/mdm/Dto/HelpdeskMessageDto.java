package com.web.mdm.Dto;

public class HelpdeskMessageDto {
    private Integer id;
    private Integer senderId;
    private String senderName;
    private String senderRole;
    private Integer receiverId;
    private Integer position;
    private String statusSent;
    private Integer replied;
    private String latestDate;
    private String body;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSenderId() {
        return senderId;
    }

    public void setSenderId(Integer senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public Integer getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Integer receiverId) {
        this.receiverId = receiverId;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public String getStatusSent() {
        return statusSent;
    }

    public void setStatusSent(String statusSent) {
        this.statusSent = statusSent;
    }

    public Integer getReplied() {
        return replied;
    }

    public void setReplied(Integer replied) {
        this.replied = replied;
    }

    public String getLatestDate() {
        return latestDate;
    }

    public void setLatestDate(String latestDate) {
        this.latestDate = latestDate;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
