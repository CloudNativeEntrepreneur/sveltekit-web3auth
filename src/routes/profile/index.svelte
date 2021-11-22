<script lang="ts">
  import { session, page } from "$app/stores";
  import { ProtectedRoute, LogoutButton } from "$lib";
</script>

<ProtectedRoute>
  <div
    class="h-screen-minus-navbar bg-gray-800 text-white flex flex-col justify-center items-center w-full"
  >
    <h1>Your Profile</h1>
    <p><strong>Public Address:</strong> {$session.user?.publicAddress}</p>
    <p><strong>Username:</strong> {$session.user?.username}</p>

    <LogoutButton>Logout</LogoutButton>
  </div>
</ProtectedRoute>
