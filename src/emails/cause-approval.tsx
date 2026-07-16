import * as React from "react";

interface CauseApprovalEmailProps {
  userName: string;
  causeTitle: string;
  causeUrl?: string;
  imageUrl?: string;
  logoUrl?: string;
}

export default function CauseApprovalEmail({
  userName,
  causeTitle,
  causeUrl = "#",
  logoUrl = "https://doacao-frontend-swart.vercel.app/logo.svg",
}: CauseApprovalEmailProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <title>Sua causa foi aprovada!</title>
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

                {/* Ilustração */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <img
                  
                    alt="Causa aprovada"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
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
                  }}
                >
                  {userName}, sua causa {causeTitle} foi aprovada!
                </h1>

                {/* Descrição */}
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#52525b",
                    marginBottom: "32px",
                  }}
                >
                  Temos a alegria de{" "}
                  <strong style={{ color: "#18181b" }}>
                    informar que a causa {causeTitle}
                  </strong>{" "}
                  foi avaliada e aprovada pela nossa equipe. Ela já está ativa e
                  visível para toda a comunidade!
                </p>

                {/* Botão */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <a
                    href={causeUrl}
                    style={{
                      display: "inline-block",
                      backgroundColor: "#86efac",
                      color: "#14532d",
                      textDecoration: "none",
                      padding: "14px 48px",
                      borderRadius: "9999px",
                      fontSize: "16px",
                      fontWeight: "700",
                    }}
                  >
                    Ver minha causa
                  </a>
                </div>

                {/* Próximo passo */}
                <div
                  style={{
                    marginTop: "8px",
                    padding: "24px",
                    backgroundColor: "#fdf2f1",
                    borderRadius: "12px",
                    border: "1px solid #fce7e4",
                    textAlign: "center",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#18181b",
                    }}
                  >
                    Qual é o próximo passo?
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#52525b",
                    }}
                  >
                    Agora que{" "}
                    <strong style={{ color: "#18181b" }}>
                      sua causa está no ar
                    </strong>
                    , não deixe de compartilhá-la em suas redes sociais para{" "}
                    <strong style={{ color: "#18181b" }}>
                      alcançar mais doadores e impactar o mundo
                    </strong>
                    . A jornada de solidariedade acabou de começar!
                  </p>
                </div>

                {/* Assinatura */}
                <div style={{ marginTop: "40px", textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#71717a",
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    &quot;Desejamos muito sucesso na sua arrecadação.&quot;
                  </p>
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
