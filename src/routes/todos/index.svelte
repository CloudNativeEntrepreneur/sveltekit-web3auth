<script context="module" lang="ts">
  import { graphQLClient } from "$lib/graphQL/urql";
  import {
    setClient,
    operationStore,
    subscription,
    mutation,
  } from "@urql/svelte";
  // you'd probably use normal $lib/config here, but if I did it'd be part of the package
  // which wouldn't work... so plain old relative import gets the job done.
  import { config } from "../../config/index";
  import ws from "ws";
  import { ProtectedRoute } from "$lib";
  import { session, page } from "$app/stores";
  import { browser } from "$app/env";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import Todo from "../../components/todos/Todo.svelte";
  import debug from "debug";

  const log = debug("sveltekit-web3auth:todos");

  let graphqlClientInstance;

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
          query = queryToObject(p.url.searchParams);
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
    order: "asc",
    offset: 0,
  };

  const QUERY = `
    query Todos(
      $limit: Int = ${defaults.limit},
      $order: order_by = ${defaults.order},
      $offset: Int = ${defaults.offset},
    ) {
      todos(
        limit: $limit,
        order_by: {createdAt: $order},
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
      $order: order_by = ${defaults.order},
      $offset: Int = ${defaults.offset},
    ) {
      todos(
        limit: $limit,
        order_by: {createdAt: $order},
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

  const TODOS_COUNT_SUBSCRIPTION = `
    subscription Todos {
      todos_aggregate {
        aggregate {
          count
        }
      }
    }
  `;

  export async function load({ url, params, session, fetch }) {
    log("todos load...", { url, params, session });

    const userAddress = session?.user?.address;
    const variables = {
      limit: parseInt(url.searchParams.get("limit"), 10) || defaults.limit,
      order: url.searchParams.get("order") || "asc",
      offset: parseInt(url.searchParams.get("offset"), 10) || defaults.offset,
    };

    const emptyResults = {
      props: {
        todos: [],
        count: 0,
      },
    };

    graphqlClientInstance = await graphQLClient({
      id: `${userAddress}`,
      session,
      graphql: config.graphql,
      fetch,
      ws,
    });

    const result = await graphqlClientInstance
      .query(QUERY, variables)
      .toPromise();
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
  if (graphqlClientInstance) {
    setClient(graphqlClientInstance);
  }
  export let todos;
  export let count;

  const limit = createQueryStore("limit");
  const order = createQueryStore("order");
  const offset = createQueryStore("offset");

  let newTodo;

  // commands
  let commandTodoInitialize;
  let commandTodoComplete;
  let commandTodoReopen;
  let commandTodoRemove;

  const handleTodosSubscription = (previousTodos = [], data) => {
    log("new todos subscription data");
    todos = data.todos;
    return [...data.todos];
  };

  const handleTodosCountSubscription = (previousCount, data) => {
    log("new todos subscription count data");
    count = data.todos_aggregate.aggregate.count;
    return count;
  };

  const startGQLClient = async () => {
    if (graphqlClientInstance) {
      setClient(graphqlClientInstance);
    } else {
      graphqlClientInstance = await graphQLClient({
        id: $session?.user?.address,
        session: $session,
        graphql: config.graphql,
        fetch: fetch || window.fetch,
        ws,
      });
      setClient(graphqlClientInstance);
    }

    const todosSubscription = operationStore(TODOS_SUBSCRIPTION, {
      limit: get(limit) || defaults.limit,
      order: get(order) || defaults.order,
      offset: get(offset) || defaults.offset,
    });

    const todosCountSubscription = operationStore(TODOS_COUNT_SUBSCRIPTION);

    subscription(todosSubscription, handleTodosSubscription);
    subscription(todosCountSubscription, handleTodosCountSubscription);

    // mutations
    commandTodoInitialize = mutation({
      query: `
      mutation CommandInitializeTodo($todo: String!) {
        command_todo_initialize(todo: $todo) {
          address
          completed
          createdAt
          id
          todo
          completedAt
        }
      }
    `,
    });

    commandTodoComplete = mutation({
      query: `
      mutation CommandCompleteTodo($id: String!) {
        command_todo_complete(id: $id) {
          address
          completed
          createdAt
          id
          todo
          completedAt
        }
      }
    `,
    });

    commandTodoReopen = mutation({
      query: `
      mutation CommandTodoReopen($id: String!) {
        command_todo_reopen(id: $id) {
          address
          completed
          createdAt
          id
          todo
          completedAt
        }
      }
    `,
    });

    commandTodoRemove = mutation({
      query: `
      mutation CommandTodoRemove($id: String!) {
        command_todo_remove(id: $id) {
          id
        }
      }
    `,
    });
  };

  const optimisticCommandTodoInitialize = async (event) => {
    let optimisticTodos = [...todos];
    optimisticTodos.push({
      todo: newTodo,
      createdAt: new Date(),
      completed: false,
    });
    todos = optimisticTodos;
    count++;
    await commandTodoInitialize({
      todo: newTodo,
    });
    newTodo = "";
    event.srcElement[0].focus();
  };

  const optimisticCommandTodoComplete = (todo) => {
    let optimisticTodos = [...todos];
    let optimisticTodo = optimisticTodos.find((t) => t.id === todo.id);
    optimisticTodo.completed = true;
    todos = optimisticTodos;
    return commandTodoComplete({
      id: todo.id,
    });
  };

  const optimisticCommandTodoReopen = (todo) => {
    let optimisticTodos = [...todos];
    let optimisticTodo = optimisticTodos.find((t) => t.id === todo.id);
    optimisticTodo.completed = false;
    todos = optimisticTodos;
    return commandTodoReopen({
      id: todo.id,
    });
  };

  const optimisticCommandTodoRemove = (todo) => {
    let optimisticTodos = [...todos];
    optimisticTodos.splice(
      optimisticTodos.findIndex((t) => t.id === todo.id),
      1
    );
    todos = optimisticTodos;
    count--;
    return commandTodoRemove({
      id: todo.id,
    });
  };

  if (browser) {
    startGQLClient();
  }
</script>

<ProtectedRoute>
  <div
    class="h-100 w-full flex items-center justify-center bg-teal-lightest font-sans"
  >
    <div class="bg-white rounded shadow p-6 m-4 w-full lg:w-3/4">
      <div class="mb-4">
        <h1 class="text-grey-darkest">{$session.user.address}'s Todo List</h1>
        <form
          class="flex mt-4"
          on:submit|preventDefault={optimisticCommandTodoInitialize}
        >
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
              <Todo
                {todo}
                {optimisticCommandTodoComplete}
                {optimisticCommandTodoReopen}
                {optimisticCommandTodoRemove}
              />
            {/each}
          </ol>
          <p>{count} Total</p>
        {/if}
      </div>
    </div>
  </div>
</ProtectedRoute>
