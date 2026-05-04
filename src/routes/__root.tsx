import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Trạm Dịu — Trạm cứu hộ cảm xúc" },
      { name: "description", content: "Một nơi an toàn để bạn lắng nghe, gọi tên và xoa dịu cảm xúc của chính mình mỗi ngày." },
      { name: "author", content: "Trạm Dịu" },
      { property: "og:title", content: "Trạm Dịu — Trạm cứu hộ cảm xúc" },
      { property: "og:description", content: "Một nơi an toàn để bạn lắng nghe, gọi tên và xoa dịu cảm xúc của chính mình mỗi ngày." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Trạm Dịu — Trạm cứu hộ cảm xúc" },
      { name: "twitter:description", content: "Một nơi an toàn để bạn lắng nghe, gọi tên và xoa dịu cảm xúc của chính mình mỗi ngày." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7c70ffc2-5078-4e15-b442-3f07b0f1598e/id-preview-939706e9--5c01d8a2-fcdf-4d2e-a59e-f18500f586ee.lovable.app-1777460223975.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7c70ffc2-5078-4e15-b442-3f07b0f1598e/id-preview-939706e9--5c01d8a2-fcdf-4d2e-a59e-f18500f586ee.lovable.app-1777460223975.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AuthProvider } from "@/lib/auth-context";
import { CapsuleNotification } from "@/components/CapsuleNotification";

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <CapsuleNotification />
    </AuthProvider>
  );
}
