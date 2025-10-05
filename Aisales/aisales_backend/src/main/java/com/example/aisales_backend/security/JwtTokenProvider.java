package com.example.aisales_backend.security;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import com.example.aisales_backend.entity.User;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${security.jwt.secret:defaultSecretKeyForDevelopmentOnly}")
    private String secret;

    @Value("${security.jwt.expiration-ms:86400000}") // 24 hours in milliseconds
    private long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    public String generateTokenWithUserId(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createToken(claims, userDetails.getUsername());
    }

    public String generateTokenForUser(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        if (user.getRole() != null) {
            claims.put("role", user.getRole().name());
        }
        if (user.getWorkspaceId() != null) {
            claims.put("workspaceId", user.getWorkspaceId());
        }
        
        // Safely handle company information
        try {
            if (user.getCompany() != null) {
                claims.put("companyId", user.getCompany().getId());
                claims.put("companyName", user.getCompany().getCompanyName());
            }
        } catch (Exception e) {
            log.warn("Could not access company information for user {}: {}", user.getEmail(), e.getMessage());
            // Don't add company information if there's an issue
        }
        
        // Add custom role and permissions information
        try {
            if (user.getCustomRole() != null) {
                log.info("User {} has custom role: {} (ID: {})", user.getEmail(), user.getCustomRole().getRoleName(), user.getCustomRole().getId());
                claims.put("customRoleId", user.getCustomRole().getId());
                claims.put("customRoleName", user.getCustomRole().getRoleName());
                
                // Add permissions as a map for easy frontend access
                Map<String, Boolean> permissions = new HashMap<>();
                if (user.getCustomRole().getPermissions() != null) {
                    log.info("User {} has {} permissions", user.getEmail(), user.getCustomRole().getPermissions().size());
                    for (var permission : user.getCustomRole().getPermissions()) {
                        permissions.put(permission.getPermissionName(), permission.getHasAccess());
                        log.info("Permission: {} = {}", permission.getPermissionName(), permission.getHasAccess());
                    }
                } else {
                    log.warn("User {} custom role has null permissions", user.getEmail());
                }
                claims.put("permissions", permissions);
                log.info("Added permissions to JWT for user {}: {}", user.getEmail(), permissions);
            } else {
                log.info("User {} has no custom role assigned", user.getEmail());
            }
        } catch (Exception e) {
            log.warn("Could not access custom role information for user {}: {}", user.getEmail(), e.getMessage());
        }
        
        return createToken(claims, user.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            log.error("JWT token validation failed: {}", e.getMessage());
            throw new JwtException("Invalid JWT token");
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
