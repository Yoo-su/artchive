import { artKeys } from "./art";
import { authKeys } from "./auth";
import { bookKeys } from "./book";
import { chatKeys } from "./chat";

export const QUERY_KEYS = {
  artKeys,
  bookKeys,
  chatKeys,
  authKeys,
} as const;
