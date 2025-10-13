package com.example.aisales_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long noteId;   // Primary Key

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;   // The note content

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;   // Timestamp when note is created

    private LocalDateTime updatedAt;   // Timestamp when note is updated

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false) // Foreign Key to Order
    private Order order;

    // Auto-set timestamps
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
