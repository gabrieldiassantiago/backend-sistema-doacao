
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
  imageUrl?: string; 
}

export default function DonationHumanEmail({
  userName,
  causeTitle,
  amount,
  xpEarned,
  newBadges,
  levelName,
  imageUrl = "https://i.pinimg.com/1200x/95/29/6f/95296fca987900919d103200d64e5f0e.jpg", 
}: DonationConfirmationEmailProps) {
  
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <title>Obrigado por sua generosidade</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#ffffff", fontFamily: "'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#3f3f46" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: "600px", margin: "0 auto" }}>
          <tbody>
            <tr>
              <td style={{ padding: "40px 20px" }}>
                
                <img 
                  src={imageUrl} 
                  alt="Família beneficiada" 
                  style={{ width: "100%", borderRadius: "12px", marginBottom: "32px", display: "block" }} 
                />

                {/* Mensagem Principal */}
                <h1 style={{ fontSize: "28px", color: "#18181b", marginBottom: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                  {userName}, você acaba de mudar uma história.
                </h1>
                
                <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#52525b", marginBottom: "24px" }}>
                  Sua doação para <strong>{causeTitle}</strong> chegou ao destino. Mais do que um valor financeiro, o que você enviou hoje foi esperança e suporte para quem mais precisa.
                </p>

                <hr style={{ border: "0", borderTop: "1px solid #f4f4f5", margin: "32px 0" }} />

                <table width="100%">
                  <tr>
                    <td>
                      <span style={{ fontSize: "14px", color: "#a1a1aa" }}>Valor da contribuição</span>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#16a34a" }}>{formattedAmount}</div>
                    </td>
                    <td align="right">
                      <span style={{ fontSize: "14px", color: "#a1a1aa" }}>Status</span>
                      <div style={{ fontSize: "16px", fontWeight: "500", color: "#18181b" }}>Confirmado ✓</div>
                    </td>
                  </tr>
                </table>

                {/* Gamificação - Tratada como "Jornada de Impacto" */}
                <div style={{ marginTop: "40px", padding: "24px", backgroundColor: "#fdfcfb", borderRadius: "12px", border: "1px solid #f5f5f4" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9a3412" }}>
                    Sua Jornada de Solidariedade
                  </h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "15px" }}>
                    Com este gesto, você somou <strong>+{xpEarned} pontos de impacto</strong> e agora é nível <strong>{levelName}</strong> em nossa comunidade.
                  </p>
                  
                  {newBadges.length > 0 && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      {newBadges.map(badge => (
                        <span key={badge.name} title={badge.name} style={{ fontSize: "24px", background: "#fff", padding: "8px", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                          {badge.icon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assinatura Humana */}
                <div style={{ marginTop: "40px", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "#71717a", fontStyle: "italic" }}>
                    "Obrigado por acreditar em um mundo melhor junto com a gente."
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#18181b", marginTop: "8px" }}>
                    Equipe da Causa
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