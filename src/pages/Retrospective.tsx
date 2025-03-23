import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ZoomIn, ZoomOut, RotateCcw, MessageSquare, ThumbsUp, ThumbsDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { Chat, MessageRow, useMyId, useNicknames, useStateTogether } from 'react-together';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string; // Change from Date to string
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

interface NoteProps {
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

interface NotesContainerProps {
  categoryId: string;
  children: React.ReactNode;
}

const NoteItem: React.FC<NoteProps> = ({ 
  note, 
  categoryId, 
  color,
  hasLiked,
  hasDisliked, 
  onDelete, 
  onReaction, 
  onComment 
}) => {
  return (
    <div className={`${color} p-4 rounded shadow-sm relative group`}>
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

const NotesContainer: React.FC<NotesContainerProps> = ({ categoryId, children }) => {
  return (
    <div className="flex flex-col gap-3 min-h-[100px]">
      {children}
    </div>
  );
};

function Retrospective() {
  const { user } = useAuth();
  const [scale, setScale] = useState(1);
  const [nickname, setNickname, allNicknames] = useNicknames();
  const userId = useMyId();
  const [isChatOpen, setIsChatOpen] = useState(false);
  

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
      author: nickname || 'Anonymous', // Use the actual nickname
      timestamp: new Date().toISOString() // Store as ISO string instead of Date object
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

  const getCategoryHeight = (notesCount: number) => {
    const baseHeight = 200;
    const heightPerNote = 100;
    const maxHeight = 800;
    return Math.min(baseHeight + (notesCount * heightPerNote), maxHeight);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="ml-2 p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              title={isChatOpen ? "Close Chat" : "Open Chat"}
            >
              <MessageSquare size={18} />
              {!isChatOpen && <span className="ml-1 hidden sm:inline">Chat</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 p-6 flex-grow flex">
        {/* Main content container with centered board that shifts when chat opens */}
        <div 
          className="flex-grow transition-all duration-300 flex justify-center"
          style={{
            marginRight: isChatOpen ? '384px' : '0',
            width: '100%',
            justifyContent: isChatOpen ? 'flex-start' : 'center',
          }}
        >
          <div
            ref={boardRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: isChatOpen ? 'left top' : 'center top',
              transition: 'transform 0.2s ease-out, transform-origin 0.3s ease-out',
            }}
            className="h-full"
          >
            <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4">
              {categories.map(category => (
                <div 
                  key={category.id} 
                  className="bg-white rounded-lg p-4 flex flex-col flex-shrink-0"
                  style={{
                    width: '300px',
                    height: '600px',
                  }}
                >
                  <h2 className="text-xl font-medium mb-4">{category.title}</h2>

                  <div className="flex-grow overflow-y-auto">
                    <NotesContainer categoryId={category.id}>
                      {category.notes.map((note, index) => (
                        <NoteItem
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
                    </NotesContainer>
                  </div>

                  {activeCategory === category.id ? (
                    <div className="mt-auto pt-3">
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
                      className="mt-auto pt-3 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
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
          
        {/* Chat sidebar that doesn't overlay content */}
        <div 
          className={`fixed right-0 top-16 bottom-0 w-96 bg-white shadow-lg transition-all duration-300 z-10`}
          style={{
            transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)',
          }}
        >
          <div className="h-full p-4 pb-6 flex flex-col relative">
            <button 
              onClick={() => setIsChatOpen(false)}
              className="absolute -left-10 top-4 bg-white p-2 rounded-l-md shadow-md"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="text-lg font-medium mb-3">Team Chat</h2>
            <div className="flex-grow overflow-y-auto">
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
        
        {/* Chat toggle button for mobile view */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed right-4 bottom-4 md:hidden p-4 bg-blue-500 text-white rounded-full shadow-lg"
          >
            <MessageSquare size={24} />
          </button>
        )}
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
  );
}

export default Retrospective;