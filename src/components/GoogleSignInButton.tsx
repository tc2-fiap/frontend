import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const SCRIPT_ID = 'google-identity-services';

// Only ever rendered by the caller when GET /api/users/config reports
// googleSignInEnabled — see the reminder in notes.md 28: sign-in with
// Google must only be offered when a real client ID is configured, never
// a button that's guaranteed to fail.
export function GoogleSignInButton({ clientId, onToken }: { clientId: string; onToken: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function render() {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onToken(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    }

    if (window.google) {
      render();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', render);
      return () => existing.removeEventListener('load', render);
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.addEventListener('load', render);
    document.body.appendChild(script);
    return () => script.removeEventListener('load', render);
  }, [clientId, onToken]);

  return <div ref={containerRef} />;
}
