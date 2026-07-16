import * as React from "react";

interface CauseUnderReviewEmailProps {
  userName: string;
  causeTitle: string;
  dashboardUrl?: string;
  logoUrl?: string;
}

export default function CauseUnderReviewEmail({
  userName,
  causeTitle,
  dashboardUrl = "https://doacao-frontend-swart.vercel.app/minhas-causas",
  logoUrl = "https://doacao-frontend-swart.vercel.app/logo.svg",
}: CauseUnderReviewEmailProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <title>Sua causa está em análise</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#ffffff",
          fontFamily: "'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif",
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
                <div style={{ marginBottom: "32px" }}>
                  <img
                    src={logoUrl}
                    alt="doare"
                    style={{
                      height: "32px",
                      display: "block",
                    }}
                  />
                </div>

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
                  {userName}, sua causa está em análise
                </h1>

                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#52525b",
                    marginBottom: "20px",
                  }}
                >
                  Recebemos sua solicitação para deixar a causa <strong style={{ color: "#18181b" }}>{causeTitle}</strong> em destaque.
                </p>

                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#52525b",
                    marginBottom: "32px",
                  }}
                >
                  Ela agora está em análise pela nossa curadoria. Assim que a revisão for concluída, você será avisado por email.
                </p>

                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <a
                    href={dashboardUrl}
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
                    Ver minhas causas
                  </a>
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    padding: "24px",
                    backgroundColor: "#f4f4f5",
                    borderRadius: "12px",
                    border: "1px solid #e4e4e7",
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
                    Dica: manter título, descrição e imagens atualizados aumenta a chance de uma curadoria mais rápida.
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