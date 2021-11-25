<script context="module">
  import { graphQLClient } from "$lib/data/urql";

  const defaults = {
    limit: 10,
    offset: 0,
  };

  const QUERY = `
    query Messages(
      $limit: Int,
      $fromFilter: String,
      $offset: Int,
      $order: order_by
    ) {
      messages(
        limit: $limit,
        order_by: {sentAt: $order},
        offset: $offset,
        where: {
          publicAddress: {_ilike: $fromFilter}
        }
      ) {
        message
        publicAddress
        sentAt
      }
      messages_aggregate(where: {publicAddress: {_ilike: $fromFilter}}) {
        aggregate {
          count
        }
      }
    }
  `;

  export async function load({ page, session }) {
    const variables = {
      limit: parseInt(page.query.get("limit"), 10) || defaults.limit,
      fromFilter: `%${page.query.get("fromFilter") || ""}%`,
      order: page.query.get("order") || "asc",
      offset: parseInt(page.query.get("offset"), 10) || defaults.offset,
    };

    let serverGQLClient = graphQLClient(session);

    const result = await serverGQLClient.query(QUERY, variables).toPromise();
    const { data } = result;
    const { messages } = data;

    return {
      props: {
        messages,
        count: data.messages_aggregate.aggregate.count,
      },
    };
  }
</script>

<script>
  export let messages;
  export let count;
</script>

<div
  class="h-screen-minus-navbar bg-gray-800 text-white flex flex-col justify-center items-center w-full"
>
  {#if !messages || (messages && messages.length === 0)}
    <p>No messages</p>
  {:else}
    <p>{count} Total</p>
    <ol>
      {#each messages as message}
        <li>
          <strong>{message.publicAddress} ({message.sentAt}):</strong> {message.message}
        </li>
      {/each}
    </ol>
  {/if}
</div>
