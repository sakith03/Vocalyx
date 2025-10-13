package com.example.aisales_backend.service.interfaces;

import com.example.aisales_backend.dto.Notes.NotesDto;
import com.example.aisales_backend.entity.Note;

import java.util.List;

public interface INoteService {

     List<NotesDto> getAllNotesByOrderId(Long orderId);

     Note createNote(Note node);
     Note updateNote(Long noteId, Note note);
     void deleteNote(Long noteId);
}
