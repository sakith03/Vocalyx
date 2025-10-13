package com.example.aisales_backend.controller;


import com.example.aisales_backend.dto.Notes.NotesDto;
import com.example.aisales_backend.entity.Note;
import com.example.aisales_backend.entity.Order;
import com.example.aisales_backend.repository.NoteRepository;
import com.example.aisales_backend.repository.OrderRepository;
import com.example.aisales_backend.service.interfaces.INoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Slf4j
public class NotesController {

    private final INoteService noteService;
    private final OrderRepository orderRepository;
    private final NoteRepository noteRepository;

    @GetMapping("/getNotes/{orderId}")
    public ResponseEntity<List<NotesDto>> getNotesByOrderId (@PathVariable Long orderId){
        return ResponseEntity.ok(noteService.getAllNotesByOrderId(orderId));
    }

    @PostMapping("/createNote/{orderId}")
    public ResponseEntity<?> createNote(@PathVariable Long orderId, @RequestBody Note noteRequest) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id " + orderId));

        noteRequest.setOrder(order);
        noteRequest.setCreatedAt(LocalDateTime.now());
        noteRequest.setUpdatedAt(LocalDateTime.now());

        Note savedNote = noteService.createNote(noteRequest);
        return ResponseEntity.ok(Map.of("message", "Note created successfully"));
    }

    @PutMapping("/updateNotes/{noteId}")
    public ResponseEntity<?> updateNote(@PathVariable Long noteId, @RequestBody Note noteRequest) {
        Note existingNote = noteRepository.getNotesByNoteId(noteId);

        if (existingNote == null) {
            return ResponseEntity.notFound().build();
        }

        // Update only the fields that are allowed to change
        if (noteRequest.getNote() != null && !noteRequest.getNote().isBlank()) {
            existingNote.setNote(noteRequest.getNote());
        }

        existingNote.setUpdatedAt(LocalDateTime.now());

        Note updatedNote = noteService.updateNote(noteId, existingNote);

        return ResponseEntity.ok(Map.of(
                "message", "Note updated successfully",
                "noteId", updatedNote.getNoteId()
        ));
    }

    // ✅ Delete a note
    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<String> deleteNote(@PathVariable Long noteId) {
        noteService.deleteNote(noteId);
        return ResponseEntity.ok("Note deleted successfully with id " + noteId);
    }
}
