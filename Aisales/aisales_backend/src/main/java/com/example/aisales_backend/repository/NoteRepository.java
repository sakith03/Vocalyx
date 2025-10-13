package com.example.aisales_backend.repository;

import com.example.aisales_backend.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    // Find all notes for a given orderId
    List<Note> findByOrderId(Long orderId);
    Note getNotesByNoteId(Long noteId);

}
