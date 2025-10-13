package com.example.aisales_backend.dto.Notes;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotesDto {
    private Long noteId;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long orderId;   // reference to Order
}