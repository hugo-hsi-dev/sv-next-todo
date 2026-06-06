# SvelteKit Todo Demo

This is a local single-user todo demo built with SvelteKit.

## Production Notes

This app intentionally has no auth or per-user data scope. Production use needs auth, a `userId` on todos, scoped remote functions, and a deployment-suitable database instead of local SQLite.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.15.4 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:none" drizzle="database:sqlite+sqlite:better-sqlite3" --install pnpm ./sveltekit
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
