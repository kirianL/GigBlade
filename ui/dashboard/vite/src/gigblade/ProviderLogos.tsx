import React from "react";

export function CloudflareLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cloudflare"
    >
      <title>Cloudflare</title>
      <path
        fill="#F38020"
        d="M22.012 22.222c.197-.675.122-1.294-.206-1.754-.3-.422-.807-.666-1.416-.694l-11.545-.15c-.075 0-.14-.038-.178-.094s-.047-.13-.028-.206c.038-.113.15-.197.272-.206l11.648-.15c1.38-.066 2.88-1.182 3.404-2.55l.666-1.735a.38.38 0 0 0 .02-.225c-.75-3.395-3.78-5.927-7.4-5.927-3.34 0-6.17 2.157-7.184 5.15-.657-.488-1.5-.75-2.392-.666-1.604.16-2.9 1.444-3.048 3.048a3.58 3.58 0 0 0 .084 1.191A4.84 4.84 0 0 0 0 22.1c0 .234.02.47.047.703.02.113.113.197.225.197H21.58a.29.29 0 0 0 .272-.206l.16-.572z"
      />
      <path
        fill="#FAAE40"
        d="M25.688 14.803l-.32.01c-.075 0-.14.056-.17.13l-.45 1.566c-.197.675-.122 1.294.206 1.754.3.422.807.666 1.416.694l2.457.15c.075 0 .14.038.178.094s.047.14.028.206c-.038.113-.15.197-.272.206l-2.56.15c-1.388.066-2.88 1.182-3.404 2.55l-.188.478c-.038.094.028.188.13.188h8.797a.23.23 0 0 0 .225-.169A6.41 6.41 0 0 0 32 21.106a6.32 6.32 0 0 0-6.312-6.302"
      />
    </svg>
  );
}

export function GoDaddyLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 36 34"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GoDaddy"
    >
      <title>GoDaddy</title>
      <path
        fill="#00A4A6"
        d="M30.82 1.45c-3.7-2.31-8.6-1.77-12.96.98-4.35-2.75-9.24-3.3-12.95-.98-5.87 3.67-6.58 13.11-1.59 21.1 3.68 5.88 9.43 9.33 14.55 9.27 5.12.06 10.87-3.39 14.54-9.27 4.99-7.99 4.28-17.43-1.59-21.1zM6.02 20.86a19.11 19.11 0 01-2.3-5.27 15.07 15.07 0 01-.5-4.97c.22-2.95 1.42-5.24 3.38-6.47 1.96-1.22 4.54-1.3 7.3-.2.42.17.83.36 1.22.57a22.5 22.5 0 00-3.95 4.75C8.14 14.12 7.2 19.5 8.27 23.8a19.72 19.72 0 01-2.25-2.95zm26-5.27a19.16 19.16 0 01-2.3 5.27 19.73 19.73 0 01-2.25 2.96c.94-3.86.3-8.58-2.02-13a.58.58 0 00-.83-.24l-7.23 4.52a.59.59 0 00-.19.81l1.06 1.7a.59.59 0 00.82.18l4.68-2.92a15.07 15.07 0 01.92 6.33c-.23 2.95-1.43 5.25-3.38 6.47a6.6 6.6 0 01-3.35.97h-.15a6.6 6.6 0 01-3.35-.97c-1.96-1.22-3.16-3.52-3.38-6.47a15.1 15.1 0 01.5-4.97 19.67 19.67 0 016.02-9.65 15.1 15.1 0 014.25-2.63c2.74-1.09 5.34-1.02 7.3.2 1.95 1.23 3.15 3.53 3.37 6.48a15.1 15.1 0 01-.49 4.96z"
      />
    </svg>
  );
}

/**
 * Official Name.com vector directly from name.com's SVG brand assets.
 */
export function NamecomLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 180 180"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Name.com"
    >
      <title>Name.com</title>
      <path
        d="M90.1 0C139.8 0 180 40.2 180 89.9s-40.2 89.9-89.9 89.9S.1 139.7.1 89.9C.1 40.3 40.4 0 90.1 0z"
        fill="#282828"
      />
      <path
        d="M39.1 121.1V59.7l18-4.3-2.8 19.8h1.9c1.1-4.6 2.9-8.5 5.2-11.6 2.5-3.2 5.5-5.6 9.2-7.2 3.8-1.7 8.2-2.6 13.2-2.6 6.5 0 12.1 1.4 16.8 4.4 4.7 2.9 8.3 7 10.8 12.6 2.6 5.4 3.9 11.9 3.9 19.5v30.8H97.4V94.8c0-5.1-.8-9.4-2.3-13-1.6-3.6-3.9-6.3-6.9-8.2-3.1-1.9-6.6-2.9-10.9-2.9-6.3 0-11.3 2-14.9 6.2-3.6 4.1-5.3 10-5.3 17.7v26.5H39.1z"
        fill="#FFFFFF"
      />
      <circle cx="137.3" cy="110.4" r="12.4" fill="#6EDA78" />
    </svg>
  );
}

export function NamecheapLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Namecheap"
    >
      <title>Namecheap</title>
      <path
        fill="#DE3723"
        d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.88 15.6h-2.16l-3.72-5.52-3.72 5.52H6.12l4.8-7.2-4.56-6.72h2.16l3.48 5.28 3.48-5.28h2.16l-4.56 6.72 4.92 7.2z"
      />
    </svg>
  );
}

export function GoogleDomainsLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Google"
    >
      <title>Google</title>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function VercelLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Vercel"
    >
      <title>Vercel</title>
      <path d="M24 22.525H0l12-21.05 12 21.05z" fill="currentColor" />
    </svg>
  );
}

export function GenericServerLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Dominio"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function ProviderBrandLogo({
  provider,
  className = "w-4 h-4 shrink-0",
}: {
  provider?: string;
  className?: string;
  nameserverDomain?: string;
}) {
  switch (provider) {
    case "cloudflare":
      return <CloudflareLogo className={className} />;
    case "godaddy":
      return <GoDaddyLogo className={className} />;
    case "namecom":
      return <NamecomLogo className={className} />;
    case "namecheap":
      return <NamecheapLogo className={className} />;
    case "google":
      return <GoogleDomainsLogo className={className} />;
    case "vercel":
      return <VercelLogo className={className} />;
    default:
      return <GenericServerLogo className={className} />;
  }
}
