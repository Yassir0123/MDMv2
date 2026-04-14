package com.web.mdm.Models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "entrepot")
public class Entrepot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", unique = true)
    private Site siteRef;

    private String telephone;
    private String email;
    private String fax;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_entrepot_user_id")
    private Users chefEntrepot;

    @OneToMany(mappedBy = "entrepot")
    @JsonIgnore
    private List<Users> users = new ArrayList<>();

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Site getSiteRef() { return siteRef; }
    public void setSiteRef(Site siteRef) { this.siteRef = siteRef; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFax() { return fax; }
    public void setFax(String fax) { this.fax = fax; }

    public Users getChefEntrepot() { return chefEntrepot; }
    public void setChefEntrepot(Users chefEntrepot) { this.chefEntrepot = chefEntrepot; }

    public List<Users> getUsers() { return users; }
    public void setUsers(List<Users> users) { this.users = users; }
}

