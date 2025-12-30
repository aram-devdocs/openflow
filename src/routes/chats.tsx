/**
 * Chats Parent Route
 *
 * Parent route for all chat-related pages.
 * This is a passthrough route that just renders the child outlet.
 */

import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/chats')({
  component: ChatsRoute,
});

function ChatsRoute() {
  return <Outlet />;
}
