import type { TodoView } from "./actions";

export type OptimisticAction =
  | { type: "create"; todo: TodoView }
  | { type: "replace"; todo: TodoView }
  | { type: "replaceId"; fromId: number; todo: TodoView }
  | { type: "remove"; id: number }
  | { type: "restore"; todo: TodoView };

function sortTodos(items: TodoView[]) {
  return [...items].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
}

export function applyOptimistic(state: TodoView[], action: OptimisticAction) {
  if (action.type === "create") return sortTodos([action.todo, ...state]);
  if (action.type === "replace") {
    return sortTodos(state.map((todo) => (todo.id === action.todo.id ? action.todo : todo)));
  }
  if (action.type === "replaceId") {
    return sortTodos(state.map((todo) => (todo.id === action.fromId ? action.todo : todo)));
  }
  if (action.type === "remove") return state.filter((todo) => todo.id !== action.id);
  return sortTodos([action.todo, ...state.filter((todo) => todo.id !== action.todo.id)]);
}
