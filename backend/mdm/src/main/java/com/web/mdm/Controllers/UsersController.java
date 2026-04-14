package com.web.mdm.Controllers;

import com.web.mdm.Models.Users;
import com.web.mdm.Services.UsersService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UsersController {

    private final UsersService usersService;

    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }

    @GetMapping
    public List<Users> getAll() {
        return usersService.getAll();
    }

    @GetMapping("/management")
    public List<Users> getManagementUsers() {
        // We fetch all users to allow filtering by the frontend
        // (active/detacher/desactiver)
        return usersService.getManagementUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Users> getById(@PathVariable Integer id) {
        return usersService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/detach")
    public ResponseEntity<Users> detachUser(@PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body) {
        Integer managerId = body != null && body.get("managerId") != null
                ? Integer.parseInt(body.get("managerId").toString())
                : null;
        String motif = body != null && body.get("motif") != null ? body.get("motif").toString() : "Détachement";
        return ResponseEntity.ok(usersService.detacherUser(id, motif, managerId));
    }

    @PostMapping("/{id}/desactiver")
    public ResponseEntity<Users> desactiverUser(@PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body) {
        Integer managerId = body != null && body.get("managerId") != null
                ? Integer.parseInt(body.get("managerId").toString())
                : null;
        String motif = body != null && body.get("motif") != null ? body.get("motif").toString() : "Désactivation";
        return ResponseEntity.ok(usersService.desactiverUser(id, motif, managerId));
    }

    @PostMapping("/{id}/reaffecter")
    public ResponseEntity<Users> reaffecterUser(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Boolean updateOrg = body.get("updateOrg") != null ? Boolean.parseBoolean(body.get("updateOrg").toString())
                : false;
        Boolean updateManager = body.get("updateManager") != null
                ? Boolean.parseBoolean(body.get("updateManager").toString())
                : false;

        Integer managerId = body.get("managerId") != null
                ? Integer.parseInt(body.get("managerId").toString())
                : null;
        Integer departementId = body.get("departementId") != null
                ? Integer.parseInt(body.get("departementId").toString())
                : null;
        Integer agenceId = body.get("agenceId") != null ? Integer.parseInt(body.get("agenceId").toString()) : null;
        Integer entrepotId = body.get("entrepotId") != null ? Integer.parseInt(body.get("entrepotId").toString())
                : null;
        return ResponseEntity.ok(usersService.reaffecterUser(id, updateOrg, departementId, agenceId, entrepotId,
                updateManager, managerId));
    }

    @PutMapping("/{id}/activer")
    public ResponseEntity<Users> activerUser(@PathVariable Integer id) {
        return ResponseEntity.ok(usersService.activerUser(id));
    }
}
