package com.web.mdm.Controllers;

import com.web.mdm.Models.HistoriqueMateriel;
import com.web.mdm.Services.HistoriqueMaterielService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historique-materiel")
@CrossOrigin(origins = "*")
public class HistoriqueMaterielController {

    private final HistoriqueMaterielService service;

    public HistoriqueMaterielController(HistoriqueMaterielService service) {
        this.service = service;
    }

    @GetMapping
    public List<HistoriqueMateriel> getAll() {
        return service.getAll();
    }

    // Endpoint to get specific history for an item (e.g. for the Details view)
    @GetMapping("/{type}/{id}")
    public List<HistoriqueMateriel> getByItem(@PathVariable String type, @PathVariable Integer id) {
        return service.getByItem(type, id);
    }

    @GetMapping("/user/{userId}")
    public List<HistoriqueMateriel> getByUser(@PathVariable Integer userId) {
        return service.getByUserId(userId);
    }
}
