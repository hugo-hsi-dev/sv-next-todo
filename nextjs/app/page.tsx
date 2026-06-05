import { listTodos } from "./actions";
import { TodoApp } from "./todo-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const todos = await listTodos();
  return <TodoApp initialTodos={todos} />;
}
