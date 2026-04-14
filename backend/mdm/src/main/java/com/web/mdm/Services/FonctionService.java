package com.web.mdm.Services;

import com.web.mdm.Models.Fonction;
import com.web.mdm.Repository.FonctionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FonctionService {

    private final FonctionRepository fonctionRepository;

    @Autowired
    public FonctionService(FonctionRepository fonctionRepository) {
        this.fonctionRepository = fonctionRepository;
    }

    public List<Fonction> getAll() { 
        return fonctionRepository.findAll(); 
    }
    
    // Updated parameter to String
    public Optional<Fonction> getById(String id) { 
        return fonctionRepository.findById(id); 
    }
    
    public Fonction save(Fonction f) { 
        return fonctionRepository.save(f); 
    }
    
    // Updated parameter to String
    public void delete(String id) { 
        fonctionRepository.deleteById(id); 
    }
}