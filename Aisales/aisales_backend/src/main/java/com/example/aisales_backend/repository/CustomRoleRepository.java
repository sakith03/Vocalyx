package com.example.aisales_backend.repository;

import com.example.aisales_backend.entity.CustomRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomRoleRepository extends JpaRepository<CustomRole, Long> {
    List<CustomRole> findByCompanyId(Long companyId);
    Optional<CustomRole> findByRoleNameAndCompanyId(String roleName, Long companyId);
    boolean existsByRoleNameAndCompanyId(String roleName, Long companyId);
}
