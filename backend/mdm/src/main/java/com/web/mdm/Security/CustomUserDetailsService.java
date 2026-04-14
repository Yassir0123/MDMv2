package com.web.mdm.Security;

import com.web.mdm.Models.Compte;
import com.web.mdm.Repository.CompteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    CompteRepository compteRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Compte compte = compteRepository.findByLogin(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with login: " + username));

        return UserDetailsImpl.build(compte);
    }
}