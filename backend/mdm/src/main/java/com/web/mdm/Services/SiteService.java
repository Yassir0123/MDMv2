package com.web.mdm.Services;

import com.web.mdm.Models.Site;
import com.web.mdm.Repository.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SiteService {
    @Autowired
    private SiteRepository siteRepository;

    public List<Site> getAll() { return siteRepository.findAll(); }
    public Optional<Site> getById(Integer id) { return siteRepository.findById(id); }
    public Site save(Site s) { return siteRepository.save(s); }
    public void delete(Integer id) { siteRepository.deleteById(id); }
}

