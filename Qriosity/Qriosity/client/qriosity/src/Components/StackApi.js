import API from "./axios";

// Get latest questions
export const getQuestions = async (page = 1, pagesize = 10) => {
  const res = await API.get("/questions", {
    params: { order: "desc", sort: "activity", page, pagesize },
  });
  return res.data.items;
};

// Get answers for a question
export const getAnswers = async (questionId) => {
  const res = await API.get(`/questions/${questionId}/answers`, {
    params: { order: "desc", sort: "votes" },
  });
  return res.data.items;
};

// Get comments for a post (question or answer)
export const getComments = async (postId) => {
  const res = await API.get(`/posts/${postId}/comments`, {
    params: { order: "desc", sort: "creation" },
  });
  return res.data.items;
};
