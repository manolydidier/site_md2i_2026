import { loginAdminMessagesAction } from "@/app/lib/messages/login/actions"; 

type PageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function AdminMessagesLoginPage({ searchParams }: PageProps) {
  const hasError = searchParams?.error === "1";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top left, rgba(239,159,39,.16), transparent 34%), #f7f4ee",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(430px, 100%)",
          padding: 28,
          borderRadius: 28,
          background: "#ffffff",
          border: "1px solid rgba(17,17,17,.08)",
          boxShadow: "0 28px 90px rgba(17,17,17,.14)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#ef9f27",
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Backoffice MD2I
        </p>

        <h1
          style={{
            margin: "0 0 10px",
            color: "#111",
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: "-.06em",
          }}
        >
          Messages contact
        </h1>

        <p
          style={{
            margin: "0 0 22px",
            color: "rgba(17,17,17,.62)",
            lineHeight: 1.65,
            fontSize: 14,
          }}
        >
          Connectez-vous pour consulter, filtrer et gérer les messages reçus via
          le formulaire de contact.
        </p>

        <form action={loginAdminMessagesAction}>
          <label
            style={{
              display: "grid",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#111",
              }}
            >
              Mot de passe administrateur
            </span>

            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              style={{
                height: 50,
                borderRadius: 16,
                border: hasError
                  ? "1px solid rgba(239,68,68,.65)"
                  : "1px solid rgba(17,17,17,.12)",
                background: "#fbfaf7",
                padding: "0 14px",
                outline: "none",
                fontSize: 14,
              }}
            />
          </label>

          {hasError ? (
            <div
              role="alert"
              style={{
                marginBottom: 14,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(239,68,68,.10)",
                border: "1px solid rgba(239,68,68,.24)",
                color: "#ef4444",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Mot de passe incorrect.
            </div>
          ) : null}

          <button
            type="submit"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 999,
              border: "none",
              background: "#ef9f27",
              color: "#111",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 950,
            }}
          >
            Accéder au backoffice
          </button>
        </form>
      </section>
    </main>
  );
}