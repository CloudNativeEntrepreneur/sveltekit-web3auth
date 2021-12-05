<script>
  export let todo;
  export let commandTodoComplete;

  const completeTodo = async (event) => {
    await commandTodoComplete({
      id: todo.id,
    });
  };
</script>

<div class="flex mb-4 items-center">
  <p class="w-full text-grey-darkest {todo.completed ? 'line-through' : ''}">
    {todo.todo}
  </p>
  {#if todo.completed}
    <button
      class="flex-no-shrink p-2 ml-4 mr-2 border-2 rounded hover:text-white text-grey border-grey hover:bg-grey"
      >Reopen</button
    >
  {:else}
    <button
      class="flex-no-shrink p-2 ml-4 mr-2 border-2 rounded hover:text-white text-green border-green hover:bg-green"
      on:click={completeTodo}>Complete</button
    >
  {/if}
  <button
    class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white hover:bg-red"
    >Remove</button
  >
</div>
