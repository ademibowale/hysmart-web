import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function CommunityScreen() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("Free");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [comments, setComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [activeReactionComment, setActiveReactionComment] = useState(null);
  const [newPostData, setNewPostData] = useState({
    title: "",
    content: "",
    screenshot: null,
    screenshotPreview: null
  });
  const [uploading, setUploading] = useState(false);

  // Reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like', color: '#3b82f6' },
    { type: 'love', emoji: '❤️', label: 'Love', color: '#ef4444' },
    { type: 'laugh', emoji: '😂', label: 'Laugh', color: '#f59e0b' },
    { type: 'angry', emoji: '😡', label: 'Angry', color: '#ef4444' },
    { type: 'sad', emoji: '😢', label: 'Sad', color: '#8b5cf6' }
  ];

  /* ================= CLEANUP OLD POSTS AND COMMENTS ================= */
  const cleanupOldContent = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const cutoffDate = oneWeekAgo.toISOString();

      const { error: postsError } = await supabase
        .from('community_posts')
        .delete()
        .lt('created_at', cutoffDate);

      if (postsError) console.error("Error deleting old posts:", postsError);

      const { error: commentsError } = await supabase
        .from('post_comments')
        .delete()
        .lt('created_at', cutoffDate);

      if (commentsError) console.error("Error deleting old comments:", commentsError);

      console.log("✅ Cleaned up content older than 1 week");
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Get user plan from profiles or user_metadata
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", currentUser.id)
            .single();
          
          if (profileError) {
            console.error("Error fetching profile:", profileError);
            const userPlan = currentUser?.user_metadata?.plan || "Free";
            setPlan(userPlan);
          } else {
            setPlan(profile.plan || "Free");
          }
        }
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Failed to load user information");
      }
    };
    loadUser();
    cleanupOldContent();
  }, []);

  // ================= EXPIRED USER REDIRECT =================
  useEffect(() => {
    if (plan === "Expired") {
      alert("⚠️ Your access has expired. Please upgrade to join the community.");
      navigate("/upgrade");
    }
  }, [plan, navigate]);

  /* ================= FETCH POSTS WITH LIKES AND COMMENTS ================= */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPosts(data || []);
      
      if (data && data.length > 0 && user) {
        const { data: likesData } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        const likedPosts = new Set(likesData?.map(l => l.post_id) || []);
        const likesMap = {};
        data.forEach(post => {
          likesMap[post.id] = likedPosts.has(post.id);
        });
        setUserLikes(likesMap);
        
        await fetchAllComments(data);
      }
      
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err.message || "Failed to load community posts.");
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ================= FETCH ALL COMMENTS WITH REACTIONS ================= */
  const fetchAllComments = async (postsList) => {
    try {
      const commentsMap = {};
      const reactionsMap = {};
      
      for (const post of postsList) {
        const { data, error } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          commentsMap[post.id] = data;
          
          for (const comment of data) {
            const { data: reactionData } = await supabase
              .from('comment_reactions')
              .select('reaction_type')
              .eq('comment_id', comment.id);
            
            const reactionCounts = {};
            reactionTypes.forEach(r => { reactionCounts[r.type] = 0; });
            
            reactionData?.forEach(reaction => {
              reactionCounts[reaction.reaction_type] = (reactionCounts[reaction.reaction_type] || 0) + 1;
            });
            
            let userReaction = null;
            if (user) {
              const { data: userReactionData } = await supabase
                .from('comment_reactions')
                .select('reaction_type')
                .eq('comment_id', comment.id)
                .eq('user_id', user.id)
                .maybeSingle();
              userReaction = userReactionData?.reaction_type || null;
            }
            
            reactionsMap[comment.id] = {
              counts: reactionCounts,
              userReaction: userReaction,
              total: reactionData?.length || 0
            };
          }
        } else {
          commentsMap[post.id] = [];
        }
      }
      
      setComments(commentsMap);
      setCommentReactions(reactionsMap);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (plan !== "Expired" && user) {
      fetchPosts();
    }
  }, [user, plan]);

  /* ================= REFRESH ================= */
  const handleRefresh = useCallback(() => {
    if (plan !== "Expired") {
      setRefreshing(true);
      fetchPosts();
      cleanupOldContent();
    }
  }, [plan]);

  /* ================= CREATE POST ================= */
  const handleCreatePost = async () => {
    if (!newPostData.title.trim() || !newPostData.content.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    try {
      setUploading(true);
      
      let screenshotUrl = null;
      
      if (newPostData.screenshot) {
        try {
          const file = newPostData.screenshot;
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `posts/${user.id}/${fileName}`;
          
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(b => b.name === 'community-images');
          
          if (!bucketExists) {
            await supabase.storage.createBucket('community-images', {
              public: true,
              fileSizeLimit: 5242880
            });
          }
          
          const { error: uploadError } = await supabase.storage
            .from('community-images')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('community-images')
            .getPublicUrl(filePath);
          
          screenshotUrl = publicUrl;
        } catch (uploadErr) {
          console.error("Error uploading screenshot:", uploadErr);
        }
      }
      
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            title: newPostData.title.trim(),
            content: newPostData.content.trim(),
            user_id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            screenshot_url: screenshotUrl,
            likes_count: 0,
            comments_count: 0,
            status: 'active',
            created_at: new Date().toISOString(),
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        setPosts([data[0], ...posts]);
        setComments({ ...comments, [data[0].id]: [] });
      }
      
      setShowCreatePostModal(false);
      setNewPostData({ title: "", content: "", screenshot: null, screenshotPreview: null });
      alert("Post created successfully!");
      
    } catch (err) {
      console.error("Error creating post:", err);
      alert(err.message || "Failed to create post.");
    } finally {
      setUploading(false);
    }
  };

  /* ================= LIKE POST ================= */
  const handleLike = async (postId) => {
    if (!user || plan === "Expired") {
      alert("Please upgrade to interact with posts");
      return;
    }

    try {
      const isLiked = userLikes[postId];
      
      if (isLiked) {
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const post = posts.find(p => p.id === postId);
        await supabase
          .from('community_posts')
          .update({ likes_count: Math.max((post.likes_count || 0) - 1, 0) })
          .eq('id', postId);
        
        setUserLikes({ ...userLikes, [postId]: false });
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likes_count: Math.max((p.likes_count || 0) - 1, 0) }
            : p
        ));
        
      } else {
        const { error } = await supabase
          .from('community_likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
        
        const post = posts.find(p => p.id === postId);
        await supabase
          .from('community_posts')
          .update({ likes_count: (post.likes_count || 0) + 1 })
          .eq('id', postId);
        
        setUserLikes({ ...userLikes, [postId]: true });
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likes_count: (p.likes_count || 0) + 1 }
            : p
        ));
      }
      
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Failed to like/unlike post");
    }
  };

  /* ================= ADD COMMENT REACTION ================= */
  const handleCommentReaction = async (commentId, reactionType) => {
    if (!user || plan === "Expired") {
      alert("Please upgrade to interact with comments");
      return;
    }

    try {
      const currentReaction = commentReactions[commentId]?.userReaction;
      
      if (currentReaction === reactionType) {
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            counts: {
              ...prev[commentId]?.counts,
              [reactionType]: Math.max((prev[commentId]?.counts[reactionType] || 0) - 1, 0)
            },
            userReaction: null,
            total: (prev[commentId]?.total || 0) - 1
          }
        }));
      } else {
        if (currentReaction) {
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', user.id);
        }
        
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType
          });
        
        if (error) throw error;
        
        setCommentReactions(prev => {
          const newCounts = { ...prev[commentId]?.counts };
          if (currentReaction) {
            newCounts[currentReaction] = Math.max((newCounts[currentReaction] || 0) - 1, 0);
          }
          newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
          
          return {
            ...prev,
            [commentId]: {
              counts: newCounts,
              userReaction: reactionType,
              total: (prev[commentId]?.total || 0) + (currentReaction ? 0 : 1)
            }
          };
        });
      }
      
      setActiveReactionComment(null);
    } catch (err) {
      console.error("Error adding reaction:", err);
      alert("Failed to add reaction");
    }
  };

  /* ================= ADD COMMENT ================= */
  const handleAddComment = async () => {
    if (!user || plan === "Expired") {
      alert("Please upgrade to comment");
      return;
    }

    if (!commentText.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('post_comments')
        .insert([
          {
            post_id: selectedPost.id,
            user_id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            user_email: user.email,
            comment: commentText.trim(),
            created_at: new Date().toISOString(),
          }
        ])
        .select();
      
      if (error) throw error;
      
      await supabase
        .from('community_posts')
        .update({ comments_count: (selectedPost.comments_count || 0) + 1 })
        .eq('id', selectedPost.id);
      
      const updatedComments = {
        ...comments,
        [selectedPost.id]: [...(comments[selectedPost.id] || []), data[0]]
      };
      setComments(updatedComments);
      
      setCommentReactions(prev => ({
        ...prev,
        [data[0].id]: {
          counts: { like: 0, love: 0, laugh: 0, angry: 0, sad: 0 },
          userReaction: null,
          total: 0
        }
      }));
      
      setPosts(posts.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments_count: (p.comments_count || 0) + 1 }
          : p
      ));
      
      setShowCommentModal(false);
      setCommentText("");
      setSelectedPost(null);
      
    } catch (err) {
      console.error("Error adding comment:", err);
      alert(err.message || "Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= TOGGLE COMMENTS VIEW ================= */
  const toggleComments = async (post) => {
    if (expandedComments[post.id]) {
      setExpandedComments({ ...expandedComments, [post.id]: false });
    } else {
      if (!comments[post.id] || comments[post.id].length === 0) {
        const { data, error } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setComments({ ...comments, [post.id]: data });
          
          for (const comment of data) {
            const { data: reactionData } = await supabase
              .from('comment_reactions')
              .select('reaction_type')
              .eq('comment_id', comment.id);
            
            const reactionCounts = {};
            reactionTypes.forEach(r => { reactionCounts[r.type] = 0; });
            
            reactionData?.forEach(reaction => {
              reactionCounts[reaction.reaction_type] = (reactionCounts[reaction.reaction_type] || 0) + 1;
            });
            
            let userReaction = null;
            if (user) {
              const { data: userReactionData } = await supabase
                .from('comment_reactions')
                .select('reaction_type')
                .eq('comment_id', comment.id)
                .eq('user_id', user.id)
                .maybeSingle();
              userReaction = userReactionData?.reaction_type || null;
            }
            
            setCommentReactions(prev => ({
              ...prev,
              [comment.id]: {
                counts: reactionCounts,
                userReaction: userReaction,
                total: reactionData?.length || 0
              }
            }));
          }
        }
      }
      setExpandedComments({ ...expandedComments, [post.id]: true });
    }
  };

  /* ================= SHARE POST ================= */
  const sharePostOnSocial = (platform, post) => {
    const shareText = `${post.title}\n\n${post.content}\n\nShare your predictions on HYSMART!`;
    const shareUrl = window.location.href;
    
    let shareLink = '';
    
    switch(platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        alert("Post copied to clipboard! You can now paste it on Instagram.");
        return;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'noopener,noreferrer');
  };

  /* ================= HANDLE SCREENSHOT ================= */
  const handleScreenshotSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostData({
          ...newPostData,
          screenshot: file,
          screenshotPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'super_admin';

  // If expired, we already redirect in useEffect – never render the page.
  // But to be safe, we still render nothing while redirecting.
  if (plan === "Expired") {
    return null; // will redirect via useEffect
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.title}>💬 Community Hub</h1>
          <p style={styles.subtitle}>Discuss predictions, share tips, and connect with fellow bettors (Posts/comments auto-clean after 1 week)</p>
        </div>

        {/* Admin Create Post Button */}
        {isAdmin && (
          <button 
            style={styles.createPostBtn}
            onClick={() => setShowCreatePostModal(true)}
          >
            + Create New Post
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <p style={styles.errorMessage}>{error}</p>
            <button style={styles.retryBtn} onClick={fetchPosts}>Retry</button>
          </div>
        )}

        {/* Posts List */}
        <div style={styles.postsContainer}>
          {posts.length === 0 && !error ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <h3 style={styles.emptyTitle}>No Posts Yet</h3>
              <p style={styles.emptyText}>Check back soon for predictions and tips from our experts!</p>
            </div>
          ) : (
            posts.map((post) => {
              const postDate = new Date(post.created_at);
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              const isOldPost = postDate < oneWeekAgo;
              
              return (
                <div key={post.id} style={{...styles.postCard, opacity: isOldPost ? 0.7 : 1}}>
                  {isOldPost && (
                    <div style={styles.oldBadge}>📅 Expired (7+ days old)</div>
                  )}
                  <div style={styles.postHeader}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatar}>
                        {post.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p style={styles.username}>
                          @{post.username || 'User'}
                          {post.user_id === user?.id && <span style={styles.youBadge}> • You</span>}
                        </p>
                        <p style={styles.date}>
                          {new Date(post.created_at).toLocaleDateString()} at{' '}
                          {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOldPost && <span style={styles.expiredBadge}> (Expired - Read Only)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 style={styles.postTitle}>{post.title}</h3>
                  <p style={styles.postContent}>{post.content}</p>
                  
                  {post.screenshot_url && (
                    <div style={styles.screenshotContainer}>
                      <img src={post.screenshot_url} alt="Post screenshot" style={styles.screenshot} />
                    </div>
                  )}
                  
                  <div style={styles.postActions}>
                    <button 
                      style={{...styles.actionBtn, color: userLikes[post.id] ? '#FFD700' : '#aaa'}}
                      onClick={() => handleLike(post.id)}
                    >
                      ❤️ {post.likes_count || 0} Likes
                    </button>
                    <button 
                      style={styles.actionBtn}
                      onClick={() => toggleComments(post)}
                    >
                      💬 {post.comments_count || comments[post.id]?.length || 0} Comments
                    </button>
                    <button 
                      style={styles.actionBtn}
                      onClick={() => {
                        setSharePost(post);
                        setShowShareModal(true);
                      }}
                    >
                      📤 Share
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div style={styles.commentsSection}>
                      <div style={styles.commentsHeader}>
                        <span>💬 Comments ({comments[post.id]?.length || 0})</span>
                      </div>
                      
                      <div style={styles.commentsList}>
                        {comments[post.id] && comments[post.id].length > 0 ? (
                          comments[post.id].map((comment, idx) => {
                            const reactionData = commentReactions[comment.id] || {
                              counts: { like: 0, love: 0, laugh: 0, angry: 0, sad: 0 },
                              userReaction: null,
                              total: 0
                            };
                            const isOldComment = new Date(comment.created_at) < oneWeekAgo;
                            
                            return (
                              <div key={comment.id || idx} style={{...styles.commentItem, opacity: isOldComment ? 0.6 : 1}}>
                                <div style={styles.commentAvatar}>
                                  {comment.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div style={styles.commentContent}>
                                  <div style={styles.commentHeader}>
                                    <span style={styles.commentUsername}>@{comment.username || 'User'}</span>
                                    <span style={styles.commentDate}>
                                      {new Date(comment.created_at).toLocaleString()}
                                      {isOldComment && <span style={styles.expiredBadge}> Expired</span>}
                                    </span>
                                  </div>
                                  <p style={styles.commentText}>{comment.comment}</p>
                                  
                                  {/* Comment Reactions - Only show if comment is not expired */}
                                  {!isOldComment && (
                                    <div style={styles.commentReactions}>
                                      {reactionTypes.map(reaction => {
                                        const count = reactionData.counts[reaction.type] || 0;
                                        const isActive = reactionData.userReaction === reaction.type;
                                        return (
                                          <button
                                            key={reaction.type}
                                            style={{
                                              ...styles.reactionBtn,
                                              backgroundColor: isActive ? `${reaction.color}20` : 'transparent',
                                              borderColor: isActive ? reaction.color : '#333'
                                            }}
                                            onClick={() => handleCommentReaction(comment.id, reaction.type)}
                                            title={reaction.label}
                                          >
                                            <span style={styles.reactionEmoji}>{reaction.emoji}</span>
                                            {count > 0 && <span style={styles.reactionCount}>{count}</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p style={styles.noComments}>No comments yet. Be the first to comment!</p>
                        )}
                      </div>
                      
                      {/* Add Comment Input - Only show if post is not expired */}
                      {user && !isOldPost && plan !== "Expired" && (
                        <div style={styles.addCommentSection}>
                          <input
                            type="text"
                            style={styles.commentInputField}
                            placeholder="Write a comment..."
                            onFocus={() => {
                              setSelectedPost(post);
                              setShowCommentModal(true);
                            }}
                          />
                          <button 
                            style={styles.postCommentBtn}
                            onClick={() => {
                              setSelectedPost(post);
                              setShowCommentModal(true);
                            }}
                          >
                            Post
                          </button>
                        </div>
                      )}
                      {isOldPost && (
                        <p style={styles.readOnlyNote}>🔒 This post is expired (7+ days old). Comments are locked.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Refresh Button */}
        {posts.length > 0 && !error && (
          <button 
            style={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh Posts'}
          </button>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePostModal && isAdmin && (
        <div style={styles.modalOverlay} onClick={() => setShowCreatePostModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Post</h2>
            
            <input
              type="text"
              style={styles.modalInput}
              placeholder="Post Title"
              value={newPostData.title}
              onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
              maxLength={100}
            />
            
            <textarea
              style={styles.modalTextarea}
              placeholder="Write your prediction or tip..."
              value={newPostData.content}
              onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
              rows="6"
              maxLength={1000}
            />
            
            <div style={styles.uploadContainer}>
              <label style={styles.uploadLabel}>
                📸 Upload Screenshot (Optional)
                <input
                  type="file"
                  accept="image/*"
                  style={styles.uploadInput}
                  onChange={handleScreenshotSelect}
                />
              </label>
              
              {newPostData.screenshotPreview && (
                <div style={styles.previewContainer}>
                  <img src={newPostData.screenshotPreview} alt="Preview" style={styles.previewImage} />
                  <button 
                    style={styles.removeImageBtn}
                    onClick={() => setNewPostData({ ...newPostData, screenshot: null, screenshotPreview: null })}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            
            <div style={styles.charCount}>
              {newPostData.content.length}/1000 characters
            </div>
            
            <div style={styles.modalActions}>
              <button 
                style={styles.modalCancel}
                onClick={() => {
                  setShowCreatePostModal(false);
                  setNewPostData({ title: "", content: "", screenshot: null, screenshotPreview: null });
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.modalSubmit}
                onClick={handleCreatePost}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setShowCommentModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Add Comment</h2>
            <p style={styles.modalSubtitle}>on: {selectedPost.title}</p>
            
            <textarea
              style={styles.modalTextarea}
              placeholder="Write your comment here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="4"
              maxLength={300}
            />
            
            <div style={styles.charCount}>
              {commentText.length}/300 characters
            </div>
            
            <div style={styles.modalActions}>
              <button 
                style={styles.modalCancel}
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentText("");
                  setSelectedPost(null);
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.modalSubmit}
                onClick={handleAddComment}
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharePost && (
        <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Share Post</h2>
            <p style={styles.modalSubtitle}>{sharePost.title}</p>
            
            <div style={styles.shareButtons}>
              <button style={styles.shareBtn} onClick={() => sharePostOnSocial('facebook', sharePost)}>
                <span style={styles.shareIcon}>📘</span> Facebook
              </button>
              <button style={styles.shareBtn} onClick={() => sharePostOnSocial('twitter', sharePost)}>
                <span style={styles.shareIcon}>🐦</span> X (Twitter)
              </button>
              <button style={styles.shareBtn} onClick={() => sharePostOnSocial('whatsapp', sharePost)}>
                <span style={styles.shareIcon}>💚</span> WhatsApp
              </button>
              <button style={styles.shareBtn} onClick={() => sharePostOnSocial('telegram', sharePost)}>
                <span style={styles.shareIcon}>📱</span> Telegram
              </button>
              <button style={styles.shareBtn} onClick={() => sharePostOnSocial('instagram', sharePost)}>
                <span style={styles.shareIcon}>📸</span> Instagram
              </button>
            </div>
            
            <div style={styles.modalActions}>
              <button style={styles.modalCancel} onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
    padding: "20px",
  },
  
  container: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  
  header: {
    marginBottom: "30px",
  },
  
  backBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    marginBottom: "20px",
    transition: "all 0.2s",
  },
  
  title: {
    color: "#FFD700",
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  
  subtitle: {
    color: "#aaa",
    fontSize: "14px",
  },
  
  createPostBtn: {
    background: "#FFD700",
    color: "#000",
    border: "none",
    padding: "12px 24px",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "30px",
    width: "100%",
    transition: "all 0.2s",
  },
  
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    border: "1px solid rgba(255, 77, 77, 0.3)",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "20px",
  },
  
  errorIcon: {
    fontSize: "20px",
  },
  
  errorMessage: {
    color: "#ff4d4d",
    fontSize: "14px",
    margin: 0,
    flex: 1,
  },
  
  retryBtn: {
    background: "#FFD700",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  
  postsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "30px",
  },
  
  postCard: {
    background: "#111",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #222",
    transition: "all 0.2s",
    position: "relative",
  },
  
  oldBadge: {
    position: "absolute",
    top: "-10px",
    right: "10px",
    background: "#ff4d4d",
    color: "#fff",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "bold",
  },
  
  expiredBadge: {
    color: "#ffaa00",
    fontSize: "10px",
    marginLeft: "8px",
  },
  
  readOnlyNote: {
    color: "#ffaa00",
    fontSize: "12px",
    textAlign: "center",
    padding: "10px",
    marginTop: "10px",
    borderTop: "1px solid #333",
  },
  
  postHeader: {
    marginBottom: "15px",
  },
  
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#FFD700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    color: "#000",
  },
  
  username: {
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  
  youBadge: {
    color: "#00ffcc",
    fontSize: "12px",
  },
  
  date: {
    color: "#666",
    fontSize: "12px",
  },
  
  postTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  
  postContent: {
    color: "#ccc",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "15px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  
  screenshotContainer: {
    marginBottom: "15px",
    borderRadius: "8px",
    overflow: "hidden",
  },
  
  screenshot: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "cover",
  },
  
  postActions: {
    display: "flex",
    gap: "20px",
    borderTop: "1px solid #222",
    paddingTop: "15px",
    marginBottom: "15px",
  },
  
  actionBtn: {
    background: "none",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "14px",
    padding: "5px 10px",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  
  commentsSection: {
    marginTop: "15px",
    borderTop: "1px solid #222",
    paddingTop: "15px",
  },
  
  commentsHeader: {
    color: "#FFD700",
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  
  commentsList: {
    maxHeight: "400px",
    overflowY: "auto",
    marginBottom: "12px",
  },
  
  commentItem: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
    padding: "10px",
    background: "#0a0a0a",
    borderRadius: "8px",
  },
  
  commentAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#FFD700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px",
    color: "#000",
    flexShrink: 0,
  },
  
  commentContent: {
    flex: 1,
  },
  
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
    flexWrap: "wrap",
    gap: "8px",
  },
  
  commentUsername: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: "12px",
  },
  
  commentDate: {
    color: "#666",
    fontSize: "10px",
  },
  
  commentText: {
    color: "#ccc",
    fontSize: "13px",
    lineHeight: "1.4",
    margin: "0 0 8px 0",
    wordBreak: "break-word",
  },
  
  commentReactions: {
    display: "flex",
    gap: "5px",
    marginTop: "5px",
  },
  
  reactionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    borderRadius: "20px",
    border: "1px solid #333",
    background: "transparent",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s",
  },
  
  reactionEmoji: {
    fontSize: "14px",
  },
  
  reactionCount: {
    fontSize: "11px",
    color: "#aaa",
  },
  
  noComments: {
    color: "#666",
    fontSize: "12px",
    textAlign: "center",
    padding: "15px",
  },
  
  addCommentSection: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
  },
  
  commentInputField: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    fontSize: "12px",
    outline: "none",
  },
  
  postCommentBtn: {
    background: "#FFD700",
    border: "none",
    padding: "6px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
  
  refreshBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
    transition: "all 0.2s",
  },
  
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(255, 215, 0, 0.2)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "20px",
  },
  
  loadingText: {
    color: "#FFD700",
    fontSize: "14px",
  },
  
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#111",
    borderRadius: "12px",
  },
  
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "20px",
  },
  
  emptyTitle: {
    color: "#FFD700",
    fontSize: "24px",
    marginBottom: "10px",
  },
  
  emptyText: {
    color: "#aaa",
    fontSize: "14px",
  },
  
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(5px)",
  },
  
  modal: {
    background: "#111",
    borderRadius: "12px",
    padding: "30px",
    width: "90%",
    maxWidth: "500px",
    border: "1px solid #FFD700",
  },
  
  modalTitle: {
    color: "#FFD700",
    fontSize: "24px",
    marginBottom: "10px",
  },
  
  modalSubtitle: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "20px",
  },
  
  modalInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  
  modalTextarea: {
    width: "100%",
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  },
  
  uploadContainer: {
    marginBottom: "15px",
  },
  
  uploadLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    background: "#000",
    border: "1px solid #333",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#FFD700",
    justifyContent: "center",
  },
  
  uploadInput: {
    display: "none",
  },
  
  previewContainer: {
    marginTop: "10px",
    position: "relative",
  },
  
  previewImage: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  
  removeImageBtn: {
    position: "absolute",
    top: "5px",
    right: "5px",
    background: "rgba(255, 77, 77, 0.9)",
    border: "none",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  
  charCount: {
    textAlign: "right",
    color: "#666",
    fontSize: "11px",
    marginBottom: "20px",
  },
  
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  
  modalCancel: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  
  modalSubmit: {
    background: "#FFD700",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  
  shareButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  
  shareBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    background: "#000",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  
  shareIcon: {
    fontSize: "20px",
  },
};

// Add animations
const addAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(255, 215, 0, 0.2);
    }
    
    .postCard:hover {
      transform: translateY(-2px);
      border-color: #FFD700;
    }
    
    button:active {
      transform: translateY(0);
    }
    
    input:focus, textarea:focus {
      outline: none;
      border-color: #FFD700 !important;
      box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1);
    }
    
    .actionBtn:hover {
      background: rgba(255, 215, 0, 0.1);
      color: #FFD700;
    }
    
    .shareBtn:hover {
      background: #222;
      border-color: #FFD700;
      transform: translateX(5px);
    }
    
    .uploadLabel:hover {
      background: #222;
      border-color: #FFD700;
    }
    
    .removeImageBtn:hover {
      background: #ff4d4d;
      transform: scale(1.1);
    }
    
    .reactionBtn:hover {
      transform: scale(1.05);
      border-color: #FFD700;
    }
  `;
  document.head.appendChild(style);
};
addAnimations();