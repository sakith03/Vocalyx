package com.example.aisales_backend.service;

import com.example.aisales_backend.dto.CreateRoleRequest;
import com.example.aisales_backend.dto.RoleResponse;
import com.example.aisales_backend.entity.CustomRole;
import com.example.aisales_backend.entity.RolePermission;
import com.example.aisales_backend.repository.CustomRoleRepository;
import com.example.aisales_backend.repository.RolePermissionRepository;
import com.example.aisales_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService {

    private final CustomRoleRepository customRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;

    @Transactional
    public RoleResponse createRole(String adminEmail, CreateRoleRequest request) {
        // Get admin user and company
        var admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to create roles");
        }

        // Check if role name already exists in this company
        if (customRoleRepository.existsByRoleNameAndCompanyId(request.getRoleName(), admin.getCompany().getId())) {
            throw new RuntimeException("Role with this name already exists in your workspace");
        }

        // Create the role
        CustomRole role = CustomRole.builder()
                .roleName(request.getRoleName())
                .description(request.getDescription())
                .company(admin.getCompany())
                .build();

        CustomRole savedRole = customRoleRepository.save(role);

        // Create permissions
        List<RolePermission> permissions = request.getPermissions().stream()
                .map(permissionRequest -> RolePermission.builder()
                        .role(savedRole)
                        .permissionName(permissionRequest.getPermissionName())
                        .hasAccess(permissionRequest.getHasAccess())
                        .build())
                .collect(Collectors.toList());

        rolePermissionRepository.saveAll(permissions);

        log.info("Role {} created for company {}", savedRole.getRoleName(), admin.getCompany().getCompanyName());

        return mapToRoleResponse(savedRole);
    }

    public List<RoleResponse> getCompanyRoles(String adminEmail) {
        var admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to view roles");
        }

        List<CustomRole> roles = customRoleRepository.findByCompanyId(admin.getCompany().getId());
        
        return roles.stream()
                .map(this::mapToRoleResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRole(String adminEmail, Long roleId) {
        var admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to delete roles");
        }

        CustomRole role = customRoleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Verify the role belongs to the admin's company
        if (!role.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new RuntimeException("Role does not belong to your workspace");
        }

        // Check if any users are assigned to this role
        boolean hasUsers = userRepository.existsByCustomRoleId(roleId);
        if (hasUsers) {
            throw new RuntimeException("Cannot delete role that is assigned to users");
        }

        // Delete permissions first
        rolePermissionRepository.deleteByRoleId(roleId);
        
        // Delete the role
        customRoleRepository.deleteById(roleId);

        log.info("Role {} deleted by admin {}", role.getRoleName(), adminEmail);
    }

    private RoleResponse mapToRoleResponse(CustomRole role) {
        List<RolePermission> permissions = rolePermissionRepository.findByRoleId(role.getId());
        
        return RoleResponse.builder()
                .id(role.getId())
                .roleName(role.getRoleName())
                .description(role.getDescription())
                .companyId(role.getCompany().getId())
                .permissions(permissions.stream()
                        .map(permission -> com.example.aisales_backend.dto.PermissionResponse.builder()
                                .id(permission.getId())
                                .permissionName(permission.getPermissionName())
                                .hasAccess(permission.getHasAccess())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }
}
