package com.web.mdm.Controllers;

import com.web.mdm.Models.Materiel;
import com.web.mdm.Repository.MaterielRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materiel")
@CrossOrigin(origins = "*")
public class MaterielController {

    @Autowired private MaterielRepository repository;

    @GetMapping
    public List<Materiel> getAll() {
        return repository.findAll();
    }
}