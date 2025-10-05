package com.example.aisales_backend.repository;

import com.example.aisales_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<User> findByCompanyId(Long companyId);
    boolean existsByCustomRoleId(Long customRoleId);
}
