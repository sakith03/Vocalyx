package com.example.aisales_backend.service.implement;

import com.example.aisales_backend.dto.Notes.NotesDto;
import com.example.aisales_backend.entity.Note;
import com.example.aisales_backend.repository.NoteRepository;
import com.example.aisales_backend.service.interfaces.INoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService implements INoteService {

    private final NoteRepository noteRepository;

    public List<NotesDto> getAllNotesByOrderId(Long orderId) {
        List<Note> notes = noteRepository.findByOrderId(orderId);

        List<NotesDto> allNotes = new ArrayList<>();

        for (Note note : notes) {
            NotesDto dto = new NotesDto();

            dto.setNoteId(note.getNoteId());
            dto.setCreatedAt(note.getCreatedAt());
            dto.setUpdatedAt(note.getUpdatedAt());
            dto.setNote(note.getNote());
            dto.setOrderId(note.getOrder().getId());


            allNotes.add(dto);
        }

        return allNotes;
    }

    public Note createNote(Note note) {
        return noteRepository.save(note);
    }

    public Note updateNote(Long noteId, Note note) {
        Note existingNote = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found with id " + noteId));

        existingNote.setNote(note.getNote());
        existingNote.setUpdatedAt(note.getUpdatedAt());

        return noteRepository.save(existingNote);
    }

    public void deleteNote(Long noteId) {
        Note existingNote = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found with id " + noteId));

        noteRepository.delete(existingNote);
    }
}
