package com.web.mdm.Controllers;

import com.web.mdm.Models.HistoriqueLigneinternet;
import com.web.mdm.Services.HistoriqueLigneinternetService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historique-ligne-internet")
@CrossOrigin(origins = "*") // <--- FIX 1: Allow Frontend Access
public class HistoriqueLigneinternetController {

    private final HistoriqueLigneinternetService service;

    public HistoriqueLigneinternetController(HistoriqueLigneinternetService service) {
        this.service = service;
    }

    // <--- FIX 2: Added the missing GET endpoint
    @GetMapping
    public List<HistoriqueLigneinternet> getAll() {
        return service.getAll();
    }
}