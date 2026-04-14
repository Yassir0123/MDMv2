package com.web.mdm.Controllers;
import com.web.mdm.Models.Ville;
import com.web.mdm.Services.VilleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/villes")
@CrossOrigin(origins = "*")
public class VilleController {
    @Autowired private VilleService service;

    @GetMapping
    public List<Ville> getAll() { return service.getAll(); }

    @PostMapping
    public Ville create(@RequestBody Ville ville) { return service.save(ville); }
}