interface BadgeInfo {
  name: string;
  icon: string;
}

interface DonationConfirmationEmailProps {
  userName: string;
  causeTitle: string;
  amount: number;
  xpEarned: number;
  newBadges: BadgeInfo[];
  levelName: string;
}

export default function DonationConfirmationEmail({
  userName,
  causeTitle,
  amount,
  xpEarned,
  newBadges,
  levelName,
}: DonationConfirmationEmailProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Doação confirmada!</title>
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

                        {/* Header */}
                        <div style={{ fontSize: "48px", marginBottom: "8px" }}>💚</div>

                        <h1
                          style={{
                            color: "#16a34a",
                            fontSize: "22px",
                            fontWeight: 700,
                            margin: "0 0 8px",
                          }}
                        >
                          Doação confirmada!
                        </h1>

                        <p
                          style={{
                            color: "#71717a",
                            fontSize: "14px",
                            margin: "0 0 28px",
                          }}
                        >
                          Olá, <strong style={{ color: "#18181b" }}>{userName}</strong>!
                          Seu pagamento foi processado com sucesso. Obrigado por fazer a diferença!
                        </p>

                        {/* Donation details box */}
                        <div
                          style={{
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "12px",
                            padding: "20px 24px",
                            marginBottom: "24px",
                            textAlign: "left",
                          }}
                        >
                          <p
                            style={{
                              color: "#15803d",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              margin: "0 0 12px",
                            }}
                          >
                            Detalhes da doação
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
                                    color: "#16a34a",
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

                        {/* XP / Level box */}
                        <div
                          style={{
                            backgroundColor: "#fefce8",
                            border: "1px solid #fde68a",
                            borderRadius: "12px",
                            padding: "16px 24px",
                            marginBottom: "24px",
                            textAlign: "left",
                          }}
                        >
                          <p
                            style={{
                              color: "#92400e",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              margin: "0 0 8px",
                            }}
                          >
                            ⭐ Sua jornada
                          </p>
                          <p style={{ margin: 0, color: "#78350f", fontSize: "13px" }}>
                            Você ganhou{" "}
                            <strong style={{ color: "#d97706", fontSize: "15px" }}>
                              +{xpEarned} XP
                            </strong>{" "}
                            e agora está no nível{" "}
                            <strong style={{ color: "#d97706" }}>{levelName}</strong>.
                          </p>
                        </div>

                        {/* New badges section (conditional) */}
                        {newBadges.length > 0 && (
                          <div
                            style={{
                              backgroundColor: "#faf5ff",
                              border: "1px solid #e9d5ff",
                              borderRadius: "12px",
                              padding: "16px 24px",
                              marginBottom: "24px",
                              textAlign: "left",
                            }}
                          >
                            <p
                              style={{
                                color: "#6b21a8",
                                fontSize: "12px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                margin: "0 0 12px",
                              }}
                            >
                              🏆 Conquistas desbloqueadas!
                            </p>

                            <table width="100%" cellPadding={0} cellSpacing={0}>
                              <tbody>
                                {newBadges.map((badge) => (
                                  <tr key={badge.name}>
                                    <td
                                      style={{
                                        paddingBottom: "6px",
                                        fontSize: "20px",
                                        width: "32px",
                                      }}
                                    >
                                      {badge.icon}
                                    </td>
                                    <td
                                      style={{
                                        paddingBottom: "6px",
                                        color: "#18181b",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {badge.name}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Footer */}
                        <p
                          style={{
                            color: "#a1a1aa",
                            fontSize: "12px",
                            margin: "0",
                            lineHeight: "1.6",
                          }}
                        >
                          Este é um email automático de confirmação. <br />
                          Juntos fazemos a diferença. 💚
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
