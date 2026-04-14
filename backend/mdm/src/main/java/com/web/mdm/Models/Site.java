package com.web.mdm.Models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "site")
public class Site {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String libeller;

    @OneToOne(mappedBy = "siteRef")
    @JsonIgnore
    private Agence agence;

    @OneToOne(mappedBy = "siteRef")
    @JsonIgnore
    private Entrepot entrepot;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getLibeller() { return libeller; }
    public void setLibeller(String libeller) { this.libeller = libeller; }

    public Agence getAgence() { return agence; }
    public void setAgence(Agence agence) { this.agence = agence; }

    public Entrepot getEntrepot() { return entrepot; }
    public void setEntrepot(Entrepot entrepot) { this.entrepot = entrepot; }
}

