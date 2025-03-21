import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, X, ZoomIn, ZoomOut, RotateCcw, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Chat, MessageRow, useConnectedUsers, useMyId, useNicknames, useStateTogether } from 'react-together';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

interface Note {
  id: string;
  text: string;
  likes: number;
  dislikes: number;
  comments: Comment[];
  likedBy: string[]; // Add array to track users who liked this note
  dislikedBy: string[]; // Add array to track users who disliked this note
}

interface Category {
  id: string;
  title: string;
  color: string;
  notes: Note[];
}

interface DraggableNoteProps {
  note: Note;
  index: number;
  categoryId: string;
  color: string;
  hasLiked: boolean;
    hasDisliked: boolean;
  onDelete: (categoryId: string, noteId: string) => void;
  onReaction: (categoryId: string, noteId: string, type: 'like' | 'dislike') => void;
  onComment: (categoryId: string, noteId: string) => void;
}

interface DroppableAreaProps {
  categoryId: string;
  children: React.ReactNode;
  onDrop: (item: { type: string; noteId: string; sourceCategory: string }, targetCategory: string) => void;
}

const DraggableNote: React.FC<DraggableNoteProps> = ({ 
  note, 
  categoryId, 
  color,
  hasLiked,
    hasDisliked, 
  onDelete, 
  onReaction, 
  onComment 
}) => {

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'note',
    item: { type: 'note', noteId: note.id, sourceCategory: categoryId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`${color} p-4 rounded shadow-sm relative group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        onClick={() => onDelete(categoryId, note.id)}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} className="text-gray-500 hover:text-gray-700" />
      </button>
      <p className="text-gray-800 text-sm break-words mb-3">{note.text}</p>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <button
          onClick={() => onReaction(categoryId, note.id, 'like')}
          className={`flex items-center gap-1 ${hasLiked ? 'text-green-500' : ''}`}

          title={
            hasLiked ? "You already liked this" :
            hasDisliked ? "You already disliked this" : 
            "Like this note"
          }
        >
          <ThumbsUp size={14} />
          {note.likes}
        </button>
        <button
          onClick={() => onReaction(categoryId, note.id, 'dislike')}
          className={`flex items-center gap-1 ${hasDisliked ? 'text-red-500' : ''}`}
          title={
            hasDisliked ? "You already disliked this" :
            hasLiked ? "You already liked this" : 
            "Dislike this note"
          }
        >
          <ThumbsDown size={14} />
          {note.dislikes}
        </button>
        <button
          onClick={() => onComment(categoryId, note.id)}
          className="flex items-center gap-1 hover:text-gray-800"
        >
          <MessageSquare size={14} />
          {note.comments.length}
        </button>
      </div>
    </div>
  );
};

const DroppableArea: React.FC<DroppableAreaProps> = ({ categoryId, children, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'note',
    drop: (item: { type: string; noteId: string; sourceCategory: string }) => {
      onDrop(item, categoryId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`grid grid-cols-2 gap-3 auto-rows-max min-h-[100px] ${
        isOver ? 'bg-gray-100 rounded-lg' : ''
      }`}
    >
      {children}
    </div>
  );
};

function Retrospective() {
  const { user } = useAuth();
  const [scale, setScale] = useStateTogether("scale",1);
  const [nickname, setNickname, allNicknames] = useNicknames();
  const userId = useMyId();
  

  useEffect(() => {
    if (user) {
      setNickname(user.email || 'Anonymous');
    }
  },[user]);

  const boardRef = useRef<HTMLDivElement>(null);


  const [categories, setCategories] = useStateTogether<Category[]>("categories",[
    {
      id: '1',
      title: 'Whats working?',
      color: 'bg-yellow-200',
      notes: []
    },
    {
      id: '2',
      title: 'What improvements should we do?',
      color: 'bg-green-400',
      notes: []
    },
    {
      id: '3',
      title: "Whats not working?",
      color: 'bg-red-200',
      notes: []
    },
    {
      id: '4',
      title: 'Helpfull last sprint improvements?',
      color: 'bg-blue-300',
      notes: []
    }
  ]);


  const [newNote, setNewNote] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<{ categoryId: string; noteId: string } | null>(null);
  const [newComment, setNewComment] = useState<string>('');

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const addNote = (categoryId: string) => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Math.random().toString(36).substr(2, 9),
      text: newNote,
      likes: 0,
      dislikes: 0,
      comments: [],
      likedBy: [], // Initialize empty array
      dislikedBy: [] // Initialize empty array
    };

    setCategories(categories.map(category => 
      category.id === categoryId 
        ? { ...category, notes: [...category.notes, note] }
        : category
    ));
    setNewNote('');
    setActiveCategory(null);
  };

  const deleteNote = (categoryId: string, noteId: string) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? { ...category, notes: category.notes.filter(note => note.id !== noteId) }
        : category
    ));
    if (activeNote?.noteId === noteId) {
      setActiveNote(null);
    }
  };

  const addComment = (categoryId: string, noteId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment,
      author: 'Anonymous',
      timestamp: new Date()
    };

    setCategories(categories.map(category => 
      category.id === categoryId
        ? {
            ...category,
            notes: category.notes.map(note =>
              note.id === noteId
                ? { ...note, comments: [...note.comments, comment] }
                : note
            )
          }
        : category
    ));
    setNewComment('');
  };

  const handleReaction = (categoryId: string, noteId: string, type: 'like' | 'dislike') => {
    setCategories(categories.map(category => 
      category.id === categoryId
        ? {
            ...category,
            notes: category.notes.map(note => {
              if (note.id !== noteId) return note;
              
              // Check if user has already reacted to this note
              const hasLiked = userId ? note.likedBy?.includes(userId) : false;
              const hasDisliked = userId ? note.dislikedBy?.includes(userId) : false;
              
              // If user has already liked the note and tries to like it again, remove the like
                if (type === 'like' && hasLiked) {
                    return {
                    ...note,
                    likes: note.likes - 1,
                    likedBy: note.likedBy?.filter(id => id !== userId),
                    };
                }
                // If user has already disliked the note and tries to dislike it again, remove the dislike
                if (type === 'dislike' && hasDisliked) {
                    return {
                    ...note,
                    dislikes: note.dislikes - 1,
                    dislikedBy: note.dislikedBy?.filter(id => id !== userId),
                    };
                }
                // If the user liked it and tries to dislike it, remove the like and add the dislike
                if (type === 'dislike' && hasLiked) {
                    return {
                    ...note,
                    likes: note.likes - 1,
                    likedBy: note.likedBy?.filter(id => id !== userId),
                    dislikes: note.dislikes + 1,
                    dislikedBy: [...(note.dislikedBy || []), userId],
                    };
                }
                // If the user disliked it and tries to like it, remove the dislike and add the like
                if (type === 'like' && hasDisliked) {
                    return {
                    ...note,
                    dislikes: note.dislikes - 1,
                    dislikedBy: note.dislikedBy?.filter(id => id !== userId),
                    likes: note.likes + 1,
                    likedBy: [...(note.likedBy || []), userId],
                    };
                }
              
              return { 
                ...note, 
                likes: type === 'like' ? note.likes + 1 : note.likes,
                dislikes: type === 'dislike' ? note.dislikes + 1 : note.dislikes,
                likedBy: type === 'like' 
                  ? [...(note.likedBy || []), userId] 
                  : (note.likedBy || []),
                dislikedBy: type === 'dislike' 
                  ? [...(note.dislikedBy || []), userId] 
                  : (note.dislikedBy || [])
              };
            })
          }
        : category
    ));
  };

  const handleDrop = (item: { noteId: string; sourceCategory: string }, targetCategoryId: string) => {
    if (item.sourceCategory === targetCategoryId) return;

    const sourceCategory = categories.find(c => c.id === item.sourceCategory);
    const note = sourceCategory?.notes.find(n => n.id === item.noteId);

    if (!sourceCategory || !note) return;

    setCategories(categories.map(category => {
      if (category.id === item.sourceCategory) {
        return {
          ...category,
          notes: category.notes.filter(n => n.id !== item.noteId)
        };
      }
      if (category.id === targetCategoryId) {
        return {
          ...category,
          notes: [...category.notes, note]
        };
      }
      return category;
    }));
  };

  const getCategoryHeight = (notesCount: number) => {
    const baseHeight = 200;
    const heightPerNote = 100;
    const maxHeight = 800;
    return Math.min(baseHeight + (notesCount * heightPerNote), maxHeight);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100">
        <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">Sprint Retrospective</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Reset Zoom"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 p-6">
          {/* Main content container with flex layout */}
          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Board container */}
            <div className="flex-1">
              <div
                ref={boardRef}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center top',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map(category => (
                    <div 
                      key={category.id} 
                      className="bg-white rounded-lg p-4"
                      style={{
                        minHeight: `${getCategoryHeight(category.notes.length)}px`,
                        transition: 'min-height 0.3s ease-out'
                      }}
                    >
                      <h2 className="text-xl font-medium mb-4">{category.title}</h2>

                      <DroppableArea categoryId={category.id} onDrop={handleDrop}>
                        {category.notes.map((note, index) => (
                          <DraggableNote
                            key={note.id}
                            note={note}
                            index={index}
                            categoryId={category.id}
                            hasLiked={note.likedBy?.includes(userId) || false}
                            hasDisliked={note.dislikedBy?.includes(userId) || false}
                            color={category.color}
                            onDelete={deleteNote}
                            onReaction={handleReaction}
                            onComment={(categoryId, noteId) => setActiveNote({ categoryId, noteId })}
                          />
                        ))}
                      </DroppableArea>

                      {activeCategory === category.id ? (
                        <div className="mt-3">
                          <textarea
                            placeholder="Type your note..."
                            className={`w-full p-3 rounded shadow-sm ${category.color} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addNote(category.id)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => setActiveCategory(null)}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => addNote(category.id)}
                              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Add Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveCategory(category.id)}
                          className="mt-3 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          <Plus size={16} />
                          Add a note
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Chat container - now wider with more bottom padding */}
            <div className="w-96 relative">
              <div className="bg-white rounded-lg p-4 pb-6 sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
                <Chat 
                  rtKey='chat' 
                  components={(props) => (
                    <MessageRow 
                      {...props} 
                      senderId={allNicknames[props.senderId] || props.senderId} 
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comments Modal */}
        {activeNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Comments</h3>
                <button onClick={() => setActiveNote(null)}>
                  <X size={24} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              
              <div className="mb-4">
                {categories.find(c => c.id === activeNote.categoryId)?.notes.find(n => n.id === activeNote.noteId)?.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment(activeNote.categoryId, activeNote.noteId)}
                />
                <button
                  onClick={() => addComment(activeNote.categoryId, activeNote.noteId)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default Retrospective;