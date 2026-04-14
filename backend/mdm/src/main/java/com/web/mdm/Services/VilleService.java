package com.web.mdm.Services;
import com.web.mdm.Models.Ville;
import com.web.mdm.Repository.VilleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class VilleService {
    @Autowired private VilleRepository repository;

    public List<Ville> getAll() { return repository.findAll(); }
    public Optional<Ville> getById(Integer id) { return repository.findById(id); }
    public Ville save(Ville ville) { return repository.save(ville); }
    public void delete(Integer id) { repository.deleteById(id); }
}