import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { COLORS } from "../../theme/colors";

// ✅ DIRECT IMPORT (no need for require fallback anymore)
import {
  likePost,
  commentPost,
  followUser,
} from "../../services/communityService";

export default function PostCard({ post = {} }) {
  const [likes, setLikes] = useState(post?.likes || 0);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);

  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  /* ================= LIKE ================= */

  const handleLike = async () => {
    if (loadingLike) return;

    try {
      setLoadingLike(true);

      const res = await likePost(post?.id);

      if (res?.success) {
        setLikes((prev) => prev + 1);
      }
    } catch (err) {
      console.log("Like error", err);
    } finally {
      setLoadingLike(false);
    }
  };

  /* ================= COMMENT ================= */

  const handleComment = async () => {
    if (loadingComment || !comment.trim()) return;

    try {
      setLoadingComment(true);

      const res = await commentPost(post?.id, comment);

      if (res?.success) {
        setComment("");
        setShowComment(false);
      }
    } catch (err) {
      console.log("Comment error", err);
    } finally {
      setLoadingComment(false);
    }
  };

  /* ================= FOLLOW ================= */

  const handleFollow = async () => {
    if (loadingFollow) return;

    try {
      setLoadingFollow(true);

      const res = await followUser(post?.userId);

      if (res?.success) {
        console.log("Followed successfully");
      }
    } catch (err) {
      console.log("Follow error", err);
    } finally {
      setLoadingFollow(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.user}>
          {post?.username || "Predictor"}
        </Text>

        <TouchableOpacity onPress={handleFollow}>
          {loadingFollow ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <Text style={styles.follow}>Follow</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <Text style={styles.match}>
        {post?.match || "Match not available"}
      </Text>

      <Text style={styles.prediction}>
        Prediction: {post?.prediction || "N/A"}
      </Text>

      {post?.analysis ? (
        <Text style={styles.analysis}>{post.analysis}</Text>
      ) : null}

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike}>
          {loadingLike ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <Text style={styles.actionBtn}>👍 {likes}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComment((prev) => !prev)}
        >
          <Text style={styles.actionBtn}>💬 Comment</Text>
        </TouchableOpacity>
      </View>

      {/* COMMENT BOX */}
      {showComment && (
        <View style={styles.commentBox}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#888"
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleComment}
          >
            {loadingComment ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  user: {
    fontWeight: "bold",
    color: COLORS.gold,
  },

  follow: {
    color: COLORS.gold,
    fontWeight: "600",
  },

  match: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.text,
  },

  prediction: {
    color: COLORS.text,
    marginBottom: 6,
  },

  analysis: {
    color: COLORS.muted,
    marginBottom: 10,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  actionBtn: {
    color: COLORS.gold,
    fontWeight: "bold",
  },

  commentBox: {
    marginTop: 10,
  },

  commentInput: {
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 6,
    color: "#fff",
    marginBottom: 6,
  },

  sendBtn: {
    backgroundColor: COLORS.gold,
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  sendText: {
    fontWeight: "bold",
    color: "#000",
  },
});