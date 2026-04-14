package com.web.mdm.Services;

import com.web.mdm.Models.Entrepot;
import com.web.mdm.Repository.EntrepotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EntrepotService {
    @Autowired
    private EntrepotRepository entrepotRepository;

    public List<Entrepot> getAll() { return entrepotRepository.findAll(); }
    public Optional<Entrepot> getById(Integer id) { return entrepotRepository.findById(id); }
    public Entrepot save(Entrepot e) { return entrepotRepository.save(e); }
    public void delete(Integer id) { entrepotRepository.deleteById(id); }
}

