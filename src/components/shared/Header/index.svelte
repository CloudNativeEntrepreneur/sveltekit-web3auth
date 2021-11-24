<script lang="ts">
  import { page } from "$app/stores";
</script>

<nav class="w-100 bg-gray-500 flex flex-col justify-center items-center h-12">
  <ul class="list-none flex flex-row w-full h-full justify-center items-center">
    <li class:nav-active={$page.path === "/"} class="nav-link md:h-full">
      <a
        class="text-center font-semibold text-gray-100"
        sveltekit:prefetch
        href="/">Home</a
      >
    </li>
    <li class:nav-active={$page.path === "/profile"} class="nav-link md:h-full">
      <a
        class="text-center font-semibold text-gray-100"
        sveltekit:prefetch
        href="/profile">Profile</a
      >
    </li>
    <li class:nav-active={$page.path === "/graphql"} class="nav-link md:h-full">
      <a
        class="text-center font-semibold text-gray-100"
        sveltekit:prefetch
        href="/graphql">GraphQL</a
      >
    </li>
  </ul>
</nav>
