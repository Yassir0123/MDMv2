package com.web.mdm.Controllers;

import com.web.mdm.Models.HistoriqueCartesim;
import com.web.mdm.Services.HistoriqueCartesimService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historique-cartesim")
@CrossOrigin(origins = "*") // <--- CRITICAL FIX: Allows React to access this
public class HistoriqueCartesimController {

    private final HistoriqueCartesimService historiqueCarteSimService;

    public HistoriqueCartesimController(HistoriqueCartesimService historiqueCarteSimService) {
        this.historiqueCarteSimService = historiqueCarteSimService;
    }

    @GetMapping
    public List<HistoriqueCartesim> getAll() {
        return historiqueCarteSimService.getAll();
    }
}