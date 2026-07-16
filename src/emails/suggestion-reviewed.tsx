import * as React from "react";

interface SuggestionReviewedEmailProps {
  userName: string;
  pointName: string;
  status: "APPROVED" | "REJECTED";
  adminNote?: string;
  logoUrl?: string;
}

export default function SuggestionReviewedEmail({
  userName,
  pointName,
  status,
  adminNote,
  logoUrl = "https://doacao-frontend-swart.vercel.app/logo.svg",
}: SuggestionReviewedEmailProps) {
  const isApproved = status === "APPROVED";

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <title>
          {isApproved
            ? "Sua sugestão foi aprovada!"
            : "Atualização sobre sua sugestão"}
        </title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#ffffff",
          fontFamily:
            "'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#3f3f46",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "40px 24px" }}>
                {/* Logo */}
                <div style={{ marginBottom: "32px" }}>
                  <img
                    src={logoUrl || "/placeholder.svg"}
                    alt="doare"
                    style={{
                      height: "32px",
                      display: "block",
                    }}
                  />
                </div>

                {/* Ícone de status */}
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div
                    style={{
                      display: "inline-block",
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundColor: isApproved ? "#dcfce7" : "#fef2f2",
                      lineHeight: "64px",
                      fontSize: "32px",
                      textAlign: "center",
                    }}
                  >
                    {isApproved ? "✅" : "❌"}
                  </div>
                </div>

                {/* Título */}
                <h1
                  style={{
                    fontSize: "28px",
                    color: "#18181b",
                    marginBottom: "16px",
                    fontWeight: "700",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.25",
                    textAlign: "center",
                  }}
                >
                  {isApproved
                    ? `${userName}, sua sugestão foi aprovada!`
                    : `${userName}, sobre sua sugestão`}
                </h1>

                {/* Descrição */}
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#52525b",
                    marginBottom: "32px",
                    textAlign: "center",
                  }}
                >
                  {isApproved ? (
                    <>
                      Sua sugestão de ponto de coleta{" "}
                      <strong style={{ color: "#18181b" }}>
                        &quot;{pointName}&quot;
                      </strong>{" "}
                      foi avaliada e aprovada pela nossa equipe! O ponto já
                      está ativo e visível no mapa para todos os usuários.
                    </>
                  ) : (
                    <>
                      Sua sugestão de ponto de coleta{" "}
                      <strong style={{ color: "#18181b" }}>
                        &quot;{pointName}&quot;
                      </strong>{" "}
                      foi analisada pela nossa equipe, mas infelizmente não
                      foi aprovada neste momento.
                    </>
                  )}
                </p>

                {/* Nota do admin (se houver) */}
                {adminNote && (
                  <div
                    style={{
                      padding: "20px 24px",
                      backgroundColor: isApproved ? "#f0fdf4" : "#fef2f2",
                      borderRadius: "12px",
                      border: `1px solid ${isApproved ? "#bbf7d0" : "#fecaca"}`,
                      marginBottom: "32px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#18181b",
                      }}
                    >
                      Mensagem da equipe:
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: "#52525b",
                        fontStyle: "italic",
                      }}
                    >
                      &quot;{adminNote}&quot;
                    </p>
                  </div>
                )}

                {/* Call to action */}
                <div
                  style={{
                    padding: "24px",
                    backgroundColor: "#f4f4f5",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#52525b",
                    }}
                  >
                    {isApproved
                      ? "Obrigado por contribuir com a comunidade! Graças a você, mais pessoas poderão encontrar pontos de doação próximos."
                      : "Você pode enviar uma nova sugestão a qualquer momento. Se tiver dúvidas, entre em contato conosco."}
                  </p>
                </div>

                {/* Assinatura */}
                <div style={{ marginTop: "40px", textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#18181b",
                      marginTop: "8px",
                      marginBottom: 0,
                    }}
                  >
                    Equipe da Plataforma
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
