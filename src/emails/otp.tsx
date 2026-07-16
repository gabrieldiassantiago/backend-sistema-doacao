interface OTPEmailProps {
  otp: string;
  userName: string;
  logoUrl?: string;
}

export default function OTPEmail({
  otp,
  userName,
  logoUrl = "https://doacao-frontend-swart.vercel.app/logo.svg",
}: OTPEmailProps) {
  const digits = otp.split("");

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Seu código de verificação</title>
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
              <td style={{ padding: "48px 24px 40px" }}>

                <div style={{ marginBottom: "40px" }}>
                  <img
                    src={logoUrl}
                    alt="doare"
                    style={{ height: "28px", display: "block" }}
                  />
                </div>

                {/* Greeting */}
                <h1
                  style={{
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#18181b",
                    margin: "0 0 12px",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.3",
                  }}
                >
                  Confirme seu endereço de e-mail
                </h1>

                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#52525b",
                    margin: "0 0 32px",
                  }}
                >
                  Olá, <strong style={{ color: "#18181b" }}>{userName}</strong>.
                  Insira o código abaixo para verificar seu e-mail e continuar.
                </p>

                <table
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ margin: "0 0 16px" }}
                >
                  <tbody>
                    <tr>
                      {digits.map((digit, i) => (
                        <td
                          key={i}
                          style={{
                            paddingRight: i < digits.length - 1 ? "8px" : "0",
                          }}
                        >
                          <div
                            style={{
                              width: "52px",
                              height: "64px",
                              backgroundColor: "#f4f4f5",
                              borderRadius: "12px",
                              textAlign: "center",
                              lineHeight: "64px",
                              fontSize: "28px",
                              fontWeight: 700,
                              color: "#18181b",
                              letterSpacing: "0",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {digit}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                {/* Expiry notice */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a1a1aa",
                    margin: "0 0 40px",
                    lineHeight: "1.5",
                  }}
                >
                  Este código expira em{" "}
                  <strong style={{ color: "#71717a" }}>10 minutos</strong>.
                </p>

                {/* Divider */}
                <hr
                  style={{
                    border: "0",
                    borderTop: "1px solid #f4f4f5",
                    margin: "0 0 24px",
                  }}
                />

                {/* Security notice */}
                <table cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={{ paddingRight: "12px", verticalAlign: "top" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            backgroundColor: "#f0fdf4",
                            borderRadius: "10px",
                            textAlign: "center",
                            lineHeight: "36px",
                            fontSize: "16px",
                          }}
                        >
                          🔒
                        </div>
                      </td>
                      <td style={{ verticalAlign: "top" }}>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#a1a1aa",
                            margin: 0,
                            lineHeight: "1.5",
                          }}
                        >
                          <strong style={{ color: "#71717a" }}>
                            Dica de segurança
                          </strong>
                          <br />
                          Nunca compartilhe este código. A equipe do Doare
                          nunca pedirá seu código por telefone, e-mail ou
                          mensagem.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer */}
                <div style={{ marginTop: "40px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#d4d4d8",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    Se você não solicitou este código, pode ignorar este
                    e-mail com segurança.
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

OTPEmail.PreviewProps = {
  otp: "847392",
  userName: "Gabriel",
};
