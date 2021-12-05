<script context="module" lang="ts">
  import { graphQLClient } from "$lib/graphQL/urql";
  import { setClient, operationStore, subscription } from "@urql/svelte";
  // you'd probably use normal $lib/config here, but if I did it'd be part of the package
  // which wouldn't work... so plain old relative import gets the job done.
  import { config } from "../../config/index";
  import ws from "ws";
  import * as stws from "subscriptions-transport-ws";
  import { ProtectedRoute } from "$lib";
  import { session, page } from "$app/stores";
  import { browser } from "$app/env";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";

  export const queryToObject = (params) => {
    // parse query string
    const obj = {};
    // iterate over all keys
    for (const key of params.keys()) {
      if (params.getAll(key).length > 1) {
        obj[key] = params.getAll(key);
      } else {
        obj[key] = params.get(key);
      }
    }
    return obj;
  };

  export function createQueryStore(prop) {
    let query;
    return {
      subscribe: (h) => {
        return page.subscribe((p) => {
          query = queryToObject(p.query);
          h(query[prop]);
        });
      },
      set: async (v) => {
        query[prop] = v;
        const urlSearchParams = new URLSearchParams(query);
        const g = `?${urlSearchParams.toString()}`;
        await goto(g, { keepfocus: true, replaceState: true, noscroll: true });
      },
    };
  }

  const defaults = {
    limit: 25,
    offset: 0,
  };

  const QUERY = `
    query Todos(
      $limit: Int = ${defaults.limit},
      $offset: Int = ${defaults.offset},
    ) {
      todos(
        limit: $limit,
        offset: $offset,
      ) {
        id
        address
        todo
        completed
        completedAt
        createdAt
      }
      todos_aggregate {
        aggregate {
          count
        }
      }
    }
  `;

  const TODOS_SUBSCRIPTION = `
    subscription Todos(
      $limit: Int = ${defaults.limit},
      $offset: Int = ${defaults.offset},
    ) {
      todos(
        limit: $limit,
        offset: $offset,
      ) {
        id
        address
        todo
        completed
        completedAt
        createdAt
      }
    }
  `;

  export async function load({ page, session, fetch }) {
    // const userAddress = session?.user?.address
    const variables = {
      limit: parseInt(page.query.get("limit"), 10) || defaults.limit,
      // order: page.query.get("order") || "asc",
      offset: parseInt(page.query.get("offset"), 10) || defaults.offset,
    };

    const emptyResults = {
      props: {
        todos: [],
        count: 0,
      },
    };

    let serverGQLClient = await graphQLClient(
      session,
      config.graphql,
      fetch,
      ws,
      stws
    );

    const result = await serverGQLClient.query(QUERY, variables).toPromise();
    const { data } = result;
    if (data) {
      const { todos } = data;

      return {
        props: {
          todos,
          count: data.todos_aggregate.aggregate.count,
        },
      };
    } else {
      return emptyResults;
    }
  }
</script>

<script>
  export let todos;
  export let count;
  const limit = createQueryStore("limit");
  // const order = createQueryStore('order')
  const offset = createQueryStore("offset");

  const handleSubscription = (previousTodos = [], data) => {
    console.log("new todos", {
      previousTodos,
      todos,
      data,
      limit,
      // order,
      offset,
    });
    todos = data.todos;
    return [...data.todos];
  };
  const startSubscription = (browserGQLClient) => {
    setClient(browserGQLClient);

    console.log("start subscription", { limit, offset });
    const todosSubscription = operationStore(TODOS_SUBSCRIPTION, {
      limit: get(limit) || defaults.limit,
      // order,
      offset: get(offset) || defaults.offset,
    });
    subscription(todosSubscription, handleSubscription);
  };
  if (browser) {
    const browserGQLClient = graphQLClient(
      $session,
      config.graphql,
      window.fetch,
      ws,
      stws
    );
    startSubscription(browserGQLClient);
  }

  let newTodo;
  const addItem = (e) => {
    console.log(newTodo);
  };
</script>

<ProtectedRoute>
  <div
    class="h-100 w-full flex items-center justify-center bg-teal-lightest font-sans"
  >
    <div class="bg-white rounded shadow p-6 m-4 w-full lg:w-3/4">
      <div class="mb-4">
        <h1 class="text-grey-darkest">{$session.user.address}'s Todo List</h1>
        <form class="flex mt-4" on:submit|preventDefault={addItem}>
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
            name="todo"
            placeholder="Add Todo"
            bind:value={newTodo}
          />
          <button
            class="flex-no-shrink p-2 border-2 rounded text-teal border-teal hover:text-white hover:bg-teal"
            >Add</button
          >
        </form>
      </div>
      <div>
        {#if !todos || (todos && todos.length === 0)}
          <p class="pt-4 pb-4">No todos</p>
        {:else}
          <ol>
            {#each todos as todo}
              <div class="flex mb-4 items-center">
                <p class="w-full text-grey-darkest">
                  {todo.todo}
                </p>
                {#if todo.done}
                  <button
                    class="flex-no-shrink p-2 ml-4 mr-2 border-2 rounded hover:text-white text-grey border-grey hover:bg-grey"
                    >Not&nbsp;Done</button
                  >
                {:else}
                  <button
                    class="flex-no-shrink p-2 ml-4 mr-2 border-2 rounded hover:text-white text-green border-green hover:bg-green"
                    >Done</button
                  >
                {/if}
                <button
                  class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white hover:bg-red"
                  >Remove</button
                >
              </div>
            {/each}
          </ol>
          <p>{count} Total</p>
        {/if}
        <!-- <div class="flex mb-4 items-center">
        <p class="w-full text-grey-darkest">
          Add another component to Tailwind Components
        </p>
        <button
          class="flex-no-shrink p-2 ml-4 mr-2 border-2 rounded hover:text-white text-green border-green hover:bg-green"
          >Done</button
        >
        <button
          class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white hover:bg-red"
          >Remove</button
        >
      </div>
      <div class="flex mb-4 items-center">
        <p class="w-full line-through text-green">
          Submit Todo App Component to Tailwind Components
        </p>
        <button
          class="flex-no-shrink p-2 ml-4 mr-2 border-2 rounded hover:text-white text-grey border-grey hover:bg-grey"
          >Not&nbsp;Done</button
        >
        <button
          class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white hover:bg-red"
          >Remove</button
        >
      </div> -->
      </div>
    </div>
  </div>
</ProtectedRoute>
