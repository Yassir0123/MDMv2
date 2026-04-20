package com.web.mdm.Services;

import com.web.mdm.Models.Archive;
import com.web.mdm.Repository.ArchiveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ArchiveService {

    @Autowired
    private ArchiveRepository archiveRepository;

    public void archiveRessource(Integer typeId, String sn, String operateur, String nomMateriel) {
        Archive archive = new Archive();
        archive.setType("Ressource");
        archive.setTypeId(typeId);
        archive.setSn(sn);
        archive.setOperateur(operateur);
        archive.setNomMateriel(nomMateriel);
        archive.setDateDeletion(LocalDateTime.now());
        
        archiveRepository.save(archive);
    }
}
