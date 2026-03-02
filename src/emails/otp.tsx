
interface OTPEmailProps {
  otp: string;
  userName: string;
}

export default function OTPEmail({ otp, userName }: OTPEmailProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verifique seu email</title>
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
                  width="420"
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

                        <div style={{ fontSize: "40px", marginBottom: "8px" }}>💚</div>

                        <h1
                          style={{
                            color: "#16a34a",
                            fontSize: "22px",
                            fontWeight: 700,
                            margin: "0 0 8px",
                          }}
                        >
                          Verifique seu email
                        </h1>

                        <p
                          style={{
                            color: "#71717a",
                            fontSize: "14px",
                            margin: "0 0 28px",
                          }}
                        >
                          Olá, <strong style={{ color: "#18181b" }}>{userName}</strong>!
                          Use o código abaixo para confirmar seu endereço de email.
                        </p>

                        <div
                          style={{
                            display: "inline-block",
                            backgroundColor: "#f0fdf4",
                            border: "2px dashed #86efac",
                            borderRadius: "12px",
                            padding: "16px 32px",
                            marginBottom: "24px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "42px",
                              fontWeight: 800,
                              letterSpacing: "10px",
                              color: "#15803d",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {otp}
                          </span>
                        </div>

                        <p
                          style={{
                            color: "#a1a1aa",
                            fontSize: "12px",
                            margin: "0 0 24px",
                          }}
                        >
                          ⏱ Este código é válido por{" "}
                          <strong style={{ color: "#71717a" }}>10 minutos</strong>.
                          <br />
                          Não compartilhe este código com ninguém.
                        </p>

                        <hr
                          style={{
                            border: "none",
                            borderTop: "1px solid #e4e4e7",
                            margin: "0 0 16px",
                          }}
                        />

                        <p
                          style={{
                            color: "#d4d4d8",
                            fontSize: "11px",
                            margin: 0,
                          }}
                        >
                          Caso não tenha solicitado este código, ignore este email.
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

OTPEmail.PreviewProps = {
  otp: "847392",
  userName: "Gabriel",
};
