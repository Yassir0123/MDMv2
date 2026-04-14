package com.web.mdm.Services;

import com.web.mdm.Models.Profile;
import com.web.mdm.Repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    public List<Profile> getAll() {
        return profileRepository.findAll();
    }

    public Optional<Profile> getById(Integer id) {
        return profileRepository.findById(id);
    }

    public Profile save(Profile profile) {
        return profileRepository.save(profile);
    }

    public void delete(Integer id) {
        profileRepository.deleteById(id);
    }
}
