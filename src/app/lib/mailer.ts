import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

type OrderItem = {
  name: string;
  price: number;
};

type OrderAcceptedEmailParams = {
  buyerEmail: string;
  buyerName: string;
  sellerName: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: {
    street?: string;
    number?: string;
    zip?: string;
    city?: string;
    country?: string;
  } | null;
  orderId: string;
};

export async function sendOrderAcceptedEmail({
  buyerEmail,
  buyerName,
  sellerName,
  items,
  total,
  shippingAddress,
  orderId,
}: OrderAcceptedEmailParams) {
  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; color: #333;">${item.name}</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #F48FB1; font-weight: 600;">€${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const addressBlock = shippingAddress
    ? `<div style="background: #f9fafb; border-radius: 8px; padding: 14px 18px; margin-top: 18px;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #333; font-size: 14px;">Lieferadresse:</p>
        <p style="margin: 0; color: #666; font-size: 14px;">
          ${shippingAddress.street || ""} ${shippingAddress.number || ""}<br/>
          ${shippingAddress.zip || ""} ${shippingAddress.city || ""}<br/>
          ${shippingAddress.country || ""}
        </p>
      </div>`
    : "";

  const html = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0;">
    <!-- Header -->
    <div style="background: #F48FB1; padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">escortcheap</h1>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <h2 style="margin: 0 0 6px 0; color: #1f1f1f; font-size: 20px;">Bestellung angenommen! ✓</h2>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 15px;">
        Hallo ${buyerName},
      </p>
      <p style="margin: 0 0 20px 0; color: #333; font-size: 15px; line-height: 1.6;">
        Gute Neuigkeiten! <strong style="color: #F48FB1;">${sellerName}</strong> hat deine Bestellung angenommen.
        Der Verkäufer wird sich in Kürze um den Versand kümmern.
      </p>

      <!-- Order Details -->
      <div style="background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; overflow: hidden; margin-bottom: 6px;">
        <div style="background: #fdf2f6; padding: 12px 16px;">
          <p style="margin: 0; font-weight: 700; color: #333; font-size: 14px;">Bestelldetails</p>
          <p style="margin: 2px 0 0 0; color: #999; font-size: 12px;">Bestell-Nr: ${orderId.slice(-8).toUpperCase()}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemRows}
          <tr>
            <td style="padding: 12px 16px; font-weight: 700; color: #1f1f1f; font-size: 15px;">Gesamt</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #F48FB1; font-size: 17px;">€${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${addressBlock}

      <p style="margin: 24px 0 0 0; color: #999; font-size: 13px; text-align: center;">
        Bei Fragen kannst du den Verkäufer direkt über den Chat auf escortcheap kontaktieren.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #fafafa; padding: 16px 24px; text-align: center; border-top: 1px solid #f0f0f0;">
      <p style="margin: 0; color: #ccc; font-size: 12px;">© ${new Date().getFullYear()} escortcheap. Alle Rechte vorbehalten.</p>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"escortcheap" <${process.env.SMTP_EMAIL}>`,
    to: buyerEmail,
    subject: `Bestellung angenommen von ${sellerName} – escortcheap`,
    html,
  });
}
