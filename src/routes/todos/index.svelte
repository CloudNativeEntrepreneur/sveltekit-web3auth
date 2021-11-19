<script lang="ts">
  import { ProtectedRoute, LogoutButton } from "$lib";
</script>

<ProtectedRoute>
  <div
    class="h-screen-minus-navbar bg-gray-800 text-white flex flex-col justify-center items-center w-full"
  >
    This is a protected page
    <LogoutButton>Logout</LogoutButton>
  </div>
</ProtectedRoute>
