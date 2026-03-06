const existingUser = localStorage.getItem("user_id");

if (!existingUser) {
  const id = "user_" + Math.floor(Math.random() * 100000);
  localStorage.setItem("user_id", id);
}

export const USER_ID = localStorage.getItem("user_id");

export const SESSION_ID =
  `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;