package com.example.aisales_backend.service;

import com.example.aisales_backend.dto.LoginRequest;
import com.example.aisales_backend.dto.RegisterRequest;
import com.example.aisales_backend.dto.UserResponse;
import com.example.aisales_backend.dto.InviteUserRequest;
import com.example.aisales_backend.dto.PasswordResetRequest;
import com.example.aisales_backend.dto.RequestPasswordResetDto;
import com.example.aisales_backend.dto.PerformPasswordResetDto;
import com.example.aisales_backend.entity.PasswordResetToken;
import com.example.aisales_backend.repository.PasswordResetTokenRepository;
import com.example.aisales_backend.dto.CompanyRequest;
import com.example.aisales_backend.entity.UserRole;
import com.example.aisales_backend.entity.User;
import com.example.aisales_backend.entity.Company;
import com.example.aisales_backend.entity.CustomRole;
import com.example.aisales_backend.repository.UserRepository;
import com.example.aisales_backend.repository.CustomRoleRepository;
import com.example.aisales_backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final CustomRoleRepository customRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;
    private final CompanyService companyService;
    private final WorkspaceService workspaceService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    // Getters for testing
    public UserRepository getUserRepository() {
        return userRepository;
    }

    public PasswordEncoder getPasswordEncoder() {
        return passwordEncoder;
    }

    @Value("${spring.mail.username:no-reply@example.com}")
    private String fromEmail;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        // All new users start as ADMIN (they will create their own company)
        // If they are invited by an existing admin, they will be assigned USER role and company_id
        UserRole assignedRole = UserRole.ADMIN;

        // Create new user without company_id initially
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {} (will need to create company)", savedUser.getEmail());

        return mapToUserResponse(savedUser);
    }

    public String login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        
        try {
            // Authenticate user using Spring Security
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
            
            // If authentication succeeds, get the user details
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));
            
            log.info("User authenticated successfully: {} (ID: {})", user.getEmail(), user.getId());
            log.info("User role: {}", user.getRole());
            
            // Safely log company information
            try {
                log.info("User company: {}", user.getCompany() != null ? user.getCompany().getCompanyName() : "null");
            } catch (Exception e) {
                log.warn("Could not access company information: {}", e.getMessage());
            }
            
            log.info("User workspace: {}", user.getWorkspaceId());

            // Generate JWT token
            String token = jwtTokenProvider.generateTokenForUser(user);
            log.info("JWT token generated for user: {}", request.getEmail());

            return token;
            
        } catch (Exception e) {
            log.error("Login failed for email: {}, error: {}", request.getEmail(), e.getMessage());
            throw new RuntimeException("Invalid email or password");
        }
    }

    // Forgot-password: issue reset token and send email
    public void requestPasswordReset(RequestPasswordResetDto request) {
        var userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            // Do not reveal user existence
            return;
        }
        var user = userOpt.get();

        // Invalidate old tokens for this user
        passwordResetTokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId()) && !t.isUsed())
                .forEach(t -> { t.setUsed(true); passwordResetTokenRepository.save(t); });

        String token = java.util.UUID.randomUUID().toString().replaceAll("-", "");
        var prt = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();
        passwordResetTokenRepository.save(prt);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Reset your Vocalyx password");
            message.setText("Click the link to reset your password: " +
                    "http://localhost:8081/reset-password?token=" + token + "\n" +
                    "This link will expire in 15 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    // Perform password reset using token
    public void performPasswordReset(PerformPasswordResetDto request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }
        var token = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (token.isUsed() || token.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired token");
        }

        var user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }

    private UserResponse mapToUserResponse(User user) {
        Long companyId = null;
        String companyName = null;
        Long customRoleId = null;
        String customRoleName = null;
        
        try {
            if (user.getCompany() != null) {
                companyId = user.getCompany().getId();
                companyName = user.getCompany().getCompanyName();
            }
            if (user.getCustomRole() != null) {
                customRoleId = user.getCustomRole().getId();
                customRoleName = user.getCustomRole().getRoleName();
            }
        } catch (Exception e) {
            log.warn("Could not access company or role information for user {}: {}", user.getEmail(), e.getMessage());
        }
        
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .companyId(companyId)
                .companyName(companyName)
                .status("Active") // For now, all users are active
                .customRoleId(customRoleId)
                .customRoleName(customRoleName)
                .build();
    }

    @Transactional
    public void inviteUser(Long adminId, InviteUserRequest request) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        // Provide placeholder names to satisfy validation constraints
        User newUser = User.builder()
                .firstName("Invited")
                .lastName("Member")
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getTemporaryPassword()))
                        .role(UserRole.USER)
                .workspaceId(admin.getWorkspaceId())
                .build();

        userRepository.save(newUser);

        // Try to send email, but don't fail the invite if email fails
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(request.getEmail());
            message.setSubject("You're invited to Vocalyx Workspace");
            message.setText("You have been invited by " + admin.getEmail() +
                    " to join their workspace.\n\n" +
                    "Temporary Password: " + request.getTemporaryPassword() + "\n" +
                    "Login at: http://localhost:5173/login\n\n" +
                    "Please change your password after first login.");
            mailSender.send(message);
            log.info("Invitation email sent to {} by admin {}", request.getEmail(), admin.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", request.getEmail(), e.getMessage());
            // User is still created, just email failed
        }
    }

    @Transactional
    public void inviteUserByEmail(String adminEmail, InviteUserRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        inviteUser(admin.getId(), request);
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        log.info("Password reset attempt for email: {}", request.getEmail());
        
        // Validate password confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            log.warn("Password confirmation mismatch for email: {}", request.getEmail());
            throw new RuntimeException("New password and confirm password do not match");
        }

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("User not found for email: {}", request.getEmail());
                    return new RuntimeException("User not found");
                });

        log.info("User found: {} (ID: {})", user.getEmail(), user.getId());
        log.info("Stored password hash: {}", user.getPassword());
        log.info("Provided current password: {}", request.getCurrentPassword());

        // Verify current password
        boolean passwordMatches = passwordEncoder.matches(request.getCurrentPassword(), user.getPassword());
        log.info("Password match result: {}", passwordMatches);
        
        if (!passwordMatches) {
            log.warn("Current password verification failed for user: {}", request.getEmail());
            throw new RuntimeException("Current password is incorrect");
        }

        // Update password
        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());
        log.info("New password hash generated: {}", newPasswordHash);
        
        user.setPassword(newPasswordHash);
        User savedUser = userRepository.save(user);
        
        log.info("Password reset successful for user: {} (ID: {})", savedUser.getEmail(), savedUser.getId());
    }

    @Transactional
    public UserResponse createCompanyAndAssignToUser(String userEmail, CompanyRequest companyRequest) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCompany() != null) {
            throw new RuntimeException("User already has a company assigned");
        }

        // Create the company
        var companyResponse = companyService.createCompany(companyRequest);
        
        // Find the created company and assign it to the user
        Company company = companyService.getCompanyById(companyResponse.getId());
        user.setCompany(company);
        
        // Create workspace for the company
        var workspaceRequest = com.example.aisales_backend.dto.WorkspaceRequest.builder()
                .companyName(companyRequest.getCompanyName())
                .industry(companyRequest.getIndustry())
                .address(companyRequest.getAddress())
                .build();
        
        var workspaceResponse = workspaceService.createWorkspaceForAdminEmail(userEmail, workspaceRequest);
        user.setWorkspaceId(workspaceResponse.getId());
        
        User savedUser = userRepository.save(user);

        log.info("Company {} and workspace {} assigned to user {}", company.getCompanyName(), workspaceResponse.getId(), user.getEmail());

        return mapToUserResponse(savedUser);
    }

    @Transactional
    public UserResponse inviteUserToCompany(String adminEmail, InviteUserRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to invite users");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        // Create new user with USER role and assign to admin's company
        String hashedPassword = passwordEncoder.encode(request.getTemporaryPassword());
        log.info("Creating invited user: {}", request.getEmail());
        log.info("Temporary password: {}", request.getTemporaryPassword());
        log.info("Hashed password: {}", hashedPassword);
        
        User newUser = User.builder()
                .firstName("Invited")
                .lastName("Member")
                .email(request.getEmail())
                .password(hashedPassword)
                        .role(UserRole.USER)
                .company(admin.getCompany())
                .workspaceId(admin.getWorkspaceId())
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Invited user created successfully: {} (ID: {})", savedUser.getEmail(), savedUser.getId());
        
        // Verify the password was saved correctly
        User verifyUser = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (verifyUser != null) {
            boolean passwordStillMatches = passwordEncoder.matches(request.getTemporaryPassword(), verifyUser.getPassword());
            log.info("Password verification after save: {}", passwordStillMatches);
            log.info("Stored password hash: {}", verifyUser.getPassword());
        }

        // Try to send email, but don't fail the invite if email fails
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(request.getEmail());
            message.setSubject("You're invited to " + admin.getCompany().getCompanyName() + " workspace");
            message.setText("You have been invited by " + admin.getEmail() +
                    " to join " + admin.getCompany().getCompanyName() + " workspace.\n\n" +
                    "Temporary Password: " + request.getTemporaryPassword() + "\n" +
                    "Login at: http://localhost:5173/login\n\n" +
                    "Please change your password after first login.");
            mailSender.send(message);
            log.info("Invitation email sent to {} by admin {}", request.getEmail(), admin.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", request.getEmail(), e.getMessage());
            // User is still created, just email failed
        }

        return mapToUserResponse(savedUser);
    }

    public List<UserResponse> getWorkspaceUsers(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to view workspace users");
        }

        // Get all users from the same company
        List<User> users = userRepository.findByCompanyId(admin.getCompany().getId());
        
        log.info("Found {} users for workspace: {}", users.size(), admin.getCompany().getCompanyName());
        
        return users.stream()
                .map(this::mapToUserResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public UserResponse updateUser(String adminEmail, Long userId, com.example.aisales_backend.dto.UpdateUserRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to update users");
        }

        // Find the user to update
        User userToUpdate = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify the user belongs to the same company
        if (userToUpdate.getCompany() == null || !userToUpdate.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new RuntimeException("User does not belong to your workspace");
        }

        // Check if email is being changed and if it's already taken
        if (!userToUpdate.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
        }

        // Update user details
        userToUpdate.setFirstName(request.getFirstName());
        userToUpdate.setLastName(request.getLastName());
        userToUpdate.setEmail(request.getEmail());

        // Handle custom role assignment
        if (request.getCustomRoleId() != null) {
            CustomRole customRole = customRoleRepository.findById(request.getCustomRoleId())
                    .orElseThrow(() -> new RuntimeException("Custom role not found"));
            
            // Verify the role belongs to the same company
            if (!customRole.getCompany().getId().equals(admin.getCompany().getId())) {
                throw new RuntimeException("Role does not belong to your workspace");
            }
            
            userToUpdate.setCustomRole(customRole);
            log.info("Custom role {} assigned to user {} by admin {}", customRole.getRoleName(), userToUpdate.getEmail(), adminEmail);
        } else {
            // Remove custom role if null
            userToUpdate.setCustomRole(null);
            log.info("Custom role removed from user {} by admin {}", userToUpdate.getEmail(), adminEmail);
        }

        User savedUser = userRepository.save(userToUpdate);
        log.info("User {} updated by admin {}", savedUser.getEmail(), adminEmail);
        
        // Log the final state of the user's role
        if (savedUser.getCustomRole() != null) {
            log.info("User {} now has custom role: {} (ID: {})", 
                savedUser.getEmail(), 
                savedUser.getCustomRole().getRoleName(), 
                savedUser.getCustomRole().getId());
        } else {
            log.info("User {} has no custom role assigned", savedUser.getEmail());
        }

        return mapToUserResponse(savedUser);
    }

    @Transactional
    public void deleteUser(String adminEmail, Long userId) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to delete users");
        }

        // Find the user to delete
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify the user belongs to the same company
        if (userToDelete.getCompany() == null || !userToDelete.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new RuntimeException("User does not belong to your workspace");
        }

        // Prevent admin from deleting themselves
        if (userToDelete.getId().equals(admin.getId())) {
            throw new RuntimeException("Cannot delete your own account");
        }

        userRepository.deleteById(userId);
        log.info("User {} deleted by admin {}", userToDelete.getEmail(), adminEmail);
    }

    @Transactional
    public UserResponse assignCustomRole(String adminEmail, Long userId, Long customRoleId) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getCompany() == null) {
            throw new RuntimeException("Admin must have a company to assign roles");
        }

        // Find the user to update
        User userToUpdate = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify the user belongs to the same company
        if (userToUpdate.getCompany() == null || !userToUpdate.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new RuntimeException("User does not belong to your workspace");
        }

        // Find the custom role
        CustomRole customRole = customRoleRepository.findById(customRoleId)
                .orElseThrow(() -> new RuntimeException("Custom role not found"));

        // Verify the role belongs to the same company
        if (!customRole.getCompany().getId().equals(admin.getCompany().getId())) {
            throw new RuntimeException("Role does not belong to your workspace");
        }

        // Assign the custom role
        userToUpdate.setCustomRole(customRole);
        User savedUser = userRepository.save(userToUpdate);

        log.info("Custom role {} assigned to user {} by admin {}", customRole.getRoleName(), savedUser.getEmail(), adminEmail);

        return mapToUserResponse(savedUser);
    }
}
