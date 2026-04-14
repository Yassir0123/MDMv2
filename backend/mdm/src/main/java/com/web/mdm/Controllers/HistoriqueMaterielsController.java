package com.web.mdm.Controllers;

import com.web.mdm.Models.HistoriqueMateriels;
import com.web.mdm.Services.HistoriqueMaterielsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/historique-materiels")
@CrossOrigin(origins = "*")
public class HistoriqueMaterielsController {
    @Autowired private HistoriqueMaterielsService service;

    @GetMapping
    public List<HistoriqueMateriels> getAll() { return service.getAll(); }

    @GetMapping("/{id}")
    public List<HistoriqueMateriels> getByMateriel(@PathVariable Integer id) {
        return service.getByMaterielId(id);
    }
}