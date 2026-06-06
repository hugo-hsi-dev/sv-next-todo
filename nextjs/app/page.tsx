import { listTodos } from "./actions";
import { TodoApp } from "./todo-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const todos = await listTodos();
  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 sm:px-6">
        <header className="mb-4 border-b border-zinc-200 pb-3">
          <h1 className="text-xl font-semibold">Todo</h1>
          <p className="text-sm text-zinc-500">Local single-user demo</p>
        </header>
        <TodoApp initialTodos={todos} />
      </div>
    </main>
  );
}
