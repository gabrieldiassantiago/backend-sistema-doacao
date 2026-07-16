import * as React from "react";

interface PaymentFailedEmailProps {
  userName: string;
  causeTitle: string;
  amount: number;
  logoUrl?: string;
}

export default function PaymentFailedEmail({
  userName,
  causeTitle,
  amount,
  logoUrl = "https://doacao-frontend-swart.vercel.app/logo.svg",
}: PaymentFailedEmailProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aviso: Problema com o seu pagamento</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f4f4f5",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#f4f4f5", padding: "40px 16px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="480"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    padding: "40px 32px",
                    textAlign: "center",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <tbody>
                    <tr>
                      <td>

                        <div style={{ marginBottom: "20px" }}>
                          <img
                            src={logoUrl}
                            alt="doare"
                            style={{
                              height: "32px",
                              display: "block",
                              margin: "0 auto",
                            }}
                          />
                        </div>

                        {/* Header */}
                        <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚠️</div>

                        <h1
                          style={{
                            color: "#dc2626",
                            fontSize: "22px",
                            fontWeight: 700,
                            margin: "0 0 8px",
                          }}
                        >
                          Pagamento não concluído
                        </h1>

                        <p
                          style={{
                            color: "#71717a",
                            fontSize: "14px",
                            margin: "0 0 28px",
                          }}
                        >
                          Olá, <strong style={{ color: "#18181b" }}>{userName}</strong>.
                          Tivemos um problema ao processar seu pagamento. Ele foi recusado ou cancelado.
                        </p>

                        {/* Donation details box */}
                        <div
                          style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "12px",
                            padding: "20px 24px",
                            marginBottom: "24px",
                            textAlign: "left",
                          }}
                        >
                          <p
                            style={{
                              color: "#b91c1c",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              margin: "0 0 12px",
                            }}
                          >
                            Detalhes da tentativa
                          </p>

                          <table width="100%" cellPadding={0} cellSpacing={0}>
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    color: "#71717a",
                                    fontSize: "13px",
                                    paddingBottom: "6px",
                                  }}
                                >
                                  Causa
                                </td>
                                <td
                                  style={{
                                    color: "#18181b",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    textAlign: "right",
                                    paddingBottom: "6px",
                                  }}
                                >
                                  {causeTitle}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    color: "#71717a",
                                    fontSize: "13px",
                                    paddingBottom: "6px",
                                  }}
                                >
                                  Valor
                                </td>
                                <td
                                  style={{
                                    color: "#dc2626",
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    textAlign: "right",
                                    paddingBottom: "6px",
                                  }}
                                >
                                  {formattedAmount}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Footer */}
                        <p
                          style={{
                            color: "#a1a1aa",
                            fontSize: "12px",
                            margin: "0",
                            lineHeight: "1.6",
                          }}
                        >
                          Você pode tentar realizar a doação novamente em nossa plataforma. <br />
                          Caso precise de ajuda, entre em contato conosco.
                        </p>

                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
