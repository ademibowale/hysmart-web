// services/communityService.js

import api from "../app/api";

/* ================= HELPER ================= */

const handleError = (label, error) => {
  console.log(`${label}:`, error?.response?.data || error.message);

  return {
    success: false,
    message:
      error?.response?.data?.message ||
      error.message ||
      "Something went wrong",
  };
};

/* ================= GET POSTS ================= */

export const getCommunityPosts = async (page = 1) => {
  try {
    const res = await api.get("/community/posts", {
      params: { page },
    });

    return {
      success: true,
      data: res?.data?.results || [],
    };
  } catch (error) {
    return handleError("Get Community Posts Error", error);
  }
};

/* ================= CREATE POST ================= */

export const createPost = async (postData) => {
  try {
    if (!postData) {
      throw new Error("Post data is required");
    }

    const res = await api.post("/community/posts", postData);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleError("Create Post Error", error);
  }
};

/* ================= LIKE POST ================= */

export const likePost = async (postId) => {
  try {
    if (!postId) throw new Error("Post ID required");

    const res = await api.post(`/community/posts/${postId}/like`);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleError("Like Post Error", error);
  }
};

/* ================= COMMENT POST ================= */

export const commentPost = async (postId, comment) => {
  try {
    if (!postId) throw new Error("Post ID required");
    if (!comment?.trim()) throw new Error("Comment cannot be empty");

    const res = await api.post(
      `/community/posts/${postId}/comments`,
      { comment }
    );

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleError("Comment Post Error", error);
  }
};

/* ================= FOLLOW USER ================= */

export const followUser = async (userId) => {
  try {
    if (!userId) throw new Error("User ID required");

    const res = await api.post(`/community/follow/${userId}`);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleError("Follow User Error", error);
  }
};