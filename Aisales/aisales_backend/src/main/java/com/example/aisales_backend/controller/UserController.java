package com.example.aisales_backend.controller;

import com.example.aisales_backend.dto.LoginRequest;
import com.example.aisales_backend.dto.RegisterRequest;
import com.example.aisales_backend.dto.UserResponse;
import com.example.aisales_backend.dto.InviteUserRequest;
import com.example.aisales_backend.dto.PasswordResetRequest;
import com.example.aisales_backend.dto.TestPasswordRequest;
import com.example.aisales_backend.dto.CompanyRequest;
import com.example.aisales_backend.dto.UpdateUserRequest;
import com.example.aisales_backend.dto.CreateRoleRequest;
import com.example.aisales_backend.dto.RoleResponse;
import com.example.aisales_backend.dto.AssignRoleRequest;
import com.example.aisales_backend.service.UserService;
import com.example.aisales_backend.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final RoleService roleService;

    //User Register
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request received for email: {}", request.getEmail());
        UserResponse response = userService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    //User Login
    @PostMapping("/login")
    public ResponseEntity<String> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());
        String token = userService.login(request);
        return ResponseEntity.ok(token);
    }

    // Invite User (Admin-only)
    @PostMapping("/invite")
    public ResponseEntity<Void> inviteUser(Authentication authentication, @Valid @RequestBody InviteUserRequest request) {
        String adminEmail = authentication.getName();
        userService.inviteUserToCompany(adminEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Reset Password
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    // Test password verification (for debugging)
    @PostMapping("/test-password")
    public ResponseEntity<String> testPassword(@RequestBody TestPasswordRequest request) {
        try {
            var user = userService.getUserRepository().findByEmail(request.getEmail());
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            var u = user.get();
            boolean matches = userService.getPasswordEncoder().matches(request.getPassword(), u.getPassword());
            
            // Test with different password encoders to debug
            String testHash = userService.getPasswordEncoder().encode(request.getPassword());
            boolean testMatch = userService.getPasswordEncoder().matches(request.getPassword(), testHash);
            
            return ResponseEntity.ok("Password match: " + matches + 
                " | Stored hash: " + u.getPassword() + 
                " | Provided: " + request.getPassword() +
                " | Test hash: " + testHash +
                " | Test match: " + testMatch +
                " | Role: " + u.getRole() +
                " | Company: " + (u.getCompany() != null ? u.getCompany().getCompanyName() : "null") +
                " | Workspace: " + u.getWorkspaceId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Create Company and assign to user
    @PostMapping("/create-company")
    public ResponseEntity<UserResponse> createCompany(Authentication authentication, @Valid @RequestBody CompanyRequest request) {
        String userEmail = authentication.getName();
        UserResponse response = userService.createCompanyAndAssignToUser(userEmail, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Test endpoint to check user details
    @GetMapping("/test-user/{email}")
    public ResponseEntity<String> testUser(@PathVariable String email) {
        try {
            var user = userService.getUserRepository().findByEmail(email);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            var u = user.get();
            return ResponseEntity.ok("User found: " + u.getEmail() + 
                " | Role: " + u.getRole() + 
                " | Company: " + (u.getCompany() != null ? u.getCompany().getCompanyName() : "null") +
                " | Workspace: " + u.getWorkspaceId() +
                " | Password hash: " + u.getPassword());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Test endpoint to create a test user
    @PostMapping("/create-test-user")
    public ResponseEntity<String> createTestUser(@RequestBody TestPasswordRequest request) {
        try {
            // Check if user already exists
            if (userService.getUserRepository().existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body("User already exists");
            }

            // Create a test user
            String hashedPassword = userService.getPasswordEncoder().encode(request.getPassword());
            var user = com.example.aisales_backend.entity.User.builder()
                    .firstName("Test")
                    .lastName("User")
                    .email(request.getEmail())
                    .password(hashedPassword)
                    .role(com.example.aisales_backend.entity.UserRole.USER)
                    .build();

            var savedUser = userService.getUserRepository().save(user);
            
            return ResponseEntity.ok("Test user created: " + savedUser.getEmail() + 
                " | Password: " + request.getPassword() +
                " | Hash: " + hashedPassword);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Test password encoding
    @PostMapping("/test-encode")
    public ResponseEntity<String> testEncode(@RequestBody TestPasswordRequest request) {
        try {
            String encoded = userService.getPasswordEncoder().encode(request.getPassword());
            boolean matches = userService.getPasswordEncoder().matches(request.getPassword(), encoded);
            
            return ResponseEntity.ok("Password: " + request.getPassword() + 
                " | Encoded: " + encoded + 
                " | Matches: " + matches);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Get all users for the current workspace
    @GetMapping("/workspace-users")
    public ResponseEntity<List<UserResponse>> getWorkspaceUsers(Authentication authentication) {
        String userEmail = authentication.getName();
        List<UserResponse> users = userService.getWorkspaceUsers(userEmail);
        return ResponseEntity.ok(users);
    }

    // Update user
    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(Authentication authentication, @PathVariable Long userId, @RequestBody UpdateUserRequest request) {
        String adminEmail = authentication.getName();
        UserResponse response = userService.updateUser(adminEmail, userId, request);
        return ResponseEntity.ok(response);
    }

    // Delete user
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(Authentication authentication, @PathVariable Long userId) {
        String adminEmail = authentication.getName();
        userService.deleteUser(adminEmail, userId);
        return ResponseEntity.noContent().build();
    }

    // Create custom role
    @PostMapping("/roles")
    public ResponseEntity<RoleResponse> createRole(Authentication authentication, @Valid @RequestBody CreateRoleRequest request) {
        String adminEmail = authentication.getName();
        RoleResponse response = roleService.createRole(adminEmail, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Get company roles
    @GetMapping("/roles")
    public ResponseEntity<List<RoleResponse>> getCompanyRoles(Authentication authentication) {
        String adminEmail = authentication.getName();
        List<RoleResponse> roles = roleService.getCompanyRoles(adminEmail);
        return ResponseEntity.ok(roles);
    }

    // Delete role
    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(Authentication authentication, @PathVariable Long roleId) {
        String adminEmail = authentication.getName();
        roleService.deleteRole(adminEmail, roleId);
        return ResponseEntity.noContent().build();
    }

    // Assign custom role to user
    @PostMapping("/{userId}/assign-role")
    public ResponseEntity<UserResponse> assignCustomRole(Authentication authentication, @PathVariable Long userId, @RequestBody AssignRoleRequest request) {
        String adminEmail = authentication.getName();
        UserResponse response = userService.assignCustomRole(adminEmail, userId, request.getCustomRoleId());
        return ResponseEntity.ok(response);
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("User service is running");
    }

    // Debug endpoint to check user role assignment
    @GetMapping("/debug/user/{userId}")
    public ResponseEntity<String> debugUserRole(@PathVariable Long userId) {
        try {
            var user = userService.getUserRepository().findById(userId);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            var u = user.get();
            String customRoleInfo = "No custom role";
            if (u.getCustomRole() != null) {
                customRoleInfo = "Custom role: " + u.getCustomRole().getRoleName() + " (ID: " + u.getCustomRole().getId() + ")";
            }
            
            return ResponseEntity.ok("User: " + u.getEmail() + 
                " | Basic Role: " + u.getRole() + 
                " | " + customRoleInfo +
                " | Company: " + (u.getCompany() != null ? u.getCompany().getCompanyName() : "null"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
