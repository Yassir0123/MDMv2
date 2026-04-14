package com.web.mdm.Services;

import com.web.mdm.Models.Departement;
import com.web.mdm.Repository.DepartementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartementService {

    @Autowired
    private DepartementRepository departementRepository;

    public List<Departement> getAll() {
        return departementRepository.findAll();
    }

    public Optional<Departement> getById(Integer id) {
        return departementRepository.findById(id);
    }

    public Departement save(Departement departement) {
        return departementRepository.save(departement);
    }

    public void delete(Integer id) {
        departementRepository.deleteById(id);
    }
}
