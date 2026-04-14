package com.web.mdm.Controllers;

import com.web.mdm.Models.HistoriqueMobile;
import com.web.mdm.Services.HistoriqueMobileService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historique-mobile")
@CrossOrigin(origins = "*") // <--- CRITICAL FIX
public class HistoriqueMobileController {

    private final HistoriqueMobileService historiqueMobileService;

    public HistoriqueMobileController(HistoriqueMobileService historiqueMobileService) {
        this.historiqueMobileService = historiqueMobileService;
    }

    @GetMapping
    public List<HistoriqueMobile> getAll() {
        return historiqueMobileService.getAll();
    }
}