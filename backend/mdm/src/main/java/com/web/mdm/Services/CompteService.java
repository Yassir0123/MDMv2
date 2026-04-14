package com.web.mdm.Services;

import com.web.mdm.Models.Compte;
import com.web.mdm.Repository.CompteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompteService {

    @Autowired
    private CompteRepository compteRepository;

    public List<Compte> getAll() {
        return compteRepository.findAll();
    }

    public Optional<Compte> getById(Integer id) {
        return compteRepository.findById(id);
    }

    public Compte save(Compte compte) {
        return compteRepository.save(compte);
    }

    public void delete(Integer id) {
        compteRepository.deleteById(id);
    }
}
