import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  Chat,
  MessageRow,
  useMyId,
  useNicknames,
  useStateTogether,
  useJoinUrl,
  useLeaveSession,
  MessageList,
  useConnectedUsers,
} from "react-together";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";

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
  onReaction: (
    categoryId: string,
    noteId: string,
    type: "like" | "dislike"
  ) => void;  
  onComment: (categoryId: string, noteId: string) => void;
}

const NoteItem: React.FC<NoteProps> = ({
  note,
  categoryId,
  color,
  hasLiked,
  hasDisliked,
  onDelete,
  onReaction,
  onComment,
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
          onClick={() => onReaction(categoryId, note.id, "like")}
          className={`flex items-center gap-1 ${
            hasLiked ? "text-green-500" : ""
          }`}
          title={
            hasLiked
              ? "You already liked this"
              : hasDisliked
              ? "You already disliked this"
              : "Like this note"
          }
        >
          <ThumbsUp size={14} />
          {note.likes}
        </button>
        <button
          onClick={() => onReaction(categoryId, note.id, "dislike")}
          className={`flex items-center gap-1 ${
            hasDisliked ? "text-red-500" : ""
          }`}
          title={
            hasDisliked
              ? "You already disliked this"
              : hasLiked
              ? "You already liked this"
              : "Dislike this note"
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


function Retrospective() {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [nickname, setNickname, allNicknames] = useNicknames();
  const userId = useMyId();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);

  const joinUrl = useJoinUrl();
  const connectedUsers = useConnectedUsers();
  const { projectUsers } = useProject();

  useEffect(() => {
    if (!user) return;
    const userInProject = projectUsers.find(
      (projectUser) => projectUser.auth_id === user.id
    );
    setNickname(userInProject?.display_name || user?.email || "Anonymous");
  }, [user, joinUrl, setNickname, nickname]);


  const [categories, setCategories] = useStateTogether<Category[]>(
    "categories",
    [
      {
        id: "1",
        title: "Whats working?",
        color: "bg-yellow-200",
        notes: [],
      },
      {
        id: "2",
        title: "Improvements list",
        color: "bg-green-400",
        notes: [],
      },
      {
        id: "3",
        title: "Whats not working?",
        color: "bg-red-200",
        notes: [],
      },
      {
        id: "4",
        title: "Previous improvements",
        color: "bg-blue-300",
        notes: [],
      },
    ]
  );

  const [newNote, setNewNote] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<{
    categoryId: string;
    noteId: string;
  } | null>(null);
  const [newComment, setNewComment] = useState<string>("");
  const leaveSession = useLeaveSession();

  const addNote = (categoryId: string) => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Math.random().toString(36).substr(2, 9),
      text: newNote,
      likes: 0,
      dislikes: 0,
      comments: [],
      likedBy: [], // Initialize empty array
      dislikedBy: [], // Initialize empty array
    };

    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? { ...category, notes: [...category.notes, note] }
          : category
      )
    );
    setNewNote("");
    setActiveCategory(null);
  };

  const deleteNote = (categoryId: string, noteId: string) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              notes: category.notes.filter((note) => note.id !== noteId),
            }
          : category
      )
    );
    if (activeNote?.noteId === noteId) {
      setActiveNote(null);
    }
  };

  const addComment = (categoryId: string, noteId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment,
      author: nickname || "Anonymous", // Use the actual nickname
      timestamp: new Date().toISOString(), // Store as ISO string instead of Date object
    };

    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              notes: category.notes.map((note) =>
                note.id === noteId
                  ? { ...note, comments: [...note.comments, comment] }
                  : note
              ),
            }
          : category
      )
    );
    setNewComment("");
  };

  const handleReaction = (
    categoryId: string,
    noteId: string,
    type: "like" | "dislike"
  ) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              notes: category.notes.map((note) => {
                if (note.id !== noteId) return note;

                // Check if user has already reacted to this note
                const hasLiked = userId
                  ? note.likedBy?.includes(userId)
                  : false;
                const hasDisliked = userId
                  ? note.dislikedBy?.includes(userId)
                  : false;

                // If user has already liked the note and tries to like it again, remove the like
                if (type === "like" && hasLiked) {
                  return {
                    ...note,
                    likes: note.likes - 1,
                    likedBy: note.likedBy?.filter((id) => id !== userId),
                  };
                }
                // If user has already disliked the note and tries to dislike it again, remove the dislike
                if (type === "dislike" && hasDisliked) {
                  return {
                    ...note,
                    dislikes: note.dislikes - 1,
                    dislikedBy: note.dislikedBy?.filter((id) => id !== userId),
                  };
                }
                // If the user liked it and tries to dislike it, remove the like and add the dislike
                if (type === "dislike" && hasLiked) {
                  return {
                    ...note,
                    likes: note.likes - 1,
                    likedBy: note.likedBy?.filter((id) => id !== userId),
                    dislikes: note.dislikes + 1,
                    dislikedBy: [...(note.dislikedBy || []), userId],
                  };
                }
                // If the user disliked it and tries to like it, remove the dislike and add the like
                if (type === "like" && hasDisliked) {
                  return {
                    ...note,
                    dislikes: note.dislikes - 1,
                    dislikedBy: note.dislikedBy?.filter((id) => id !== userId),
                    likes: note.likes + 1,
                    likedBy: [...(note.likedBy || []), userId],
                  };
                }

                return {
                  ...note,
                  likes: type === "like" ? note.likes + 1 : note.likes,
                  dislikes:
                    type === "dislike" ? note.dislikes + 1 : note.dislikes,
                  likedBy:
                    type === "like"
                      ? [...(note.likedBy || []), userId]
                      : note.likedBy || [],
                  dislikedBy:
                    type === "dislike"
                      ? [...(note.dislikedBy || []), userId]
                      : note.dislikedBy || [],
                };
              }),
            }
          : category
      )
    );
  };

  // Add go back function handler
  const handleGoBack = useCallback(() => {
    leaveSession();
    navigate(-1); // Navigate back to previous page
  }, [leaveSession, navigate]);

  // Add this CSS override using useEffect
  useEffect(() => {
    // Add a style tag to override the rt-chat class
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .rt-chat {
        display: flex !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up function to remove the style tag when component unmounts
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Add back button */}
            <button
              onClick={handleGoBack}
              className="p-1.5 hover:bg-gray-100 rounded flex items-center text-gray-700"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Sprint Retrospective
            </h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              title={isChatOpen ? "Close Chat" : "Open Chat"}
            >
              <MessageSquare size={18} />
              <span className="ml-1 hidden sm:inline">
                {isChatOpen ? "Hide Chat" : "Show Chat"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 flex-grow flex">
        {/* Main content container with horizontal scrolling for categories */}
        <div
          className="w-full transition-all duration-300 overflow-x-auto"
          style={{
            marginRight: isChatOpen ? "384px" : "0",
          }}
        >
          <div 
            className="py-6 px-4 min-w-max mx-auto transition-all duration-300"
          >
            <div className="flex flex-nowrap gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg p-4 flex flex-col shadow-sm"
                  style={{
                    width: "300px",
                    height: "500px",
                    flexShrink: 0, // Prevent shrinking
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-4 h-4 ${category.color} rounded`}></div>
                    <h2 className="text-xl font-medium">{category.title}</h2>
                  </div>

                  <div className="flex-grow overflow-y-auto">
                    <div className="flex flex-col gap-3 min-h-[100px]">
                      {category.notes.map((note, index) => (
                        <NoteItem
                          key={note.id}
                          note={note}
                          index={index}
                          categoryId={category.id}
                          hasLiked={note.likedBy?.includes(userId) || false}
                          hasDisliked={
                            note.dislikedBy?.includes(userId) || false
                          }
                          color={category.color}
                          onDelete={deleteNote}
                          onReaction={handleReaction}
                          onComment={(categoryId, noteId) =>
                            setActiveNote({ categoryId, noteId })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {activeCategory === category.id ? (
                    <div className="mt-auto pt-3">
                      <textarea
                        placeholder="Type your note..."
                        className={`w-full p-3 rounded shadow-sm ${category.color} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          addNote(category.id)
                        }
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
            transform: isChatOpen ? "translateX(0)" : "translateX(100%)",
          }}
        >
          <div className="h-full p-4 pb-6 flex flex-col relative">
            {isChatOpen && (
              <button
                onClick={() => setIsChatOpen(false)}
                className="absolute -left-10 top-4 bg-white p-2 rounded-l-md shadow-md"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <div className="flex-grow flex">
              <Chat
                rtKey="chat"
                components={{
                  MessageRow: (props) => (
                    <MessageRow
                      {...props}
                      senderId={allNicknames[props.senderId] || props.senderId}
                    />
                  ),
                  ChatHeader: (props) => (
                    <div className="flex items-center justify-between p-3 px-5 border-b">
                      <span className="rt-chatHeader-title">Team Chat</span>
                      <button 
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          onClick={() => setShowUsersModal(true)}
                        >
                        {connectedUsers.length} users online
                      </button>
                    </div>
                  ),
                  MessageList: (props) => (
                    <MessageList
                      {...props}
                      style={{display:'flex'}}
                    />
                  ),
                }}
              />
            </div>
          </div>
        </div>

        {/* Connected Users Modal */}
        {showUsersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Connected Users</h3>
                <button onClick={() => setShowUsersModal(false)}>
                  <X size={24} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                <ul className="divide-y">
                  {connectedUsers.map(({userId, nickname, isYou}) => (
                    <li key={userId} className="py-3 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-800">
                        {nickname}
                        {isYou && " (you)"}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {connectedUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No users connected</p>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
              {categories
                .find((c) => c.id === activeNote.categoryId)
                ?.notes.find((n) => n.id === activeNote.noteId)
                ?.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 p-3 rounded-lg mb-2"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author}
                      </span>
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
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  addComment(activeNote.categoryId, activeNote.noteId)
                }
              />
              <button
                onClick={() =>
                  addComment(activeNote.categoryId, activeNote.noteId)
                }
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
