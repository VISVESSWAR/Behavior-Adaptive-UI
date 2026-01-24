import QRCode from "qrcode";

export async function generateQR(share, email) {
    const payload = {
        email,
        x: share.x,
        y: share.y
    };

    return await QRCode.toDataURL(JSON.stringify(payload));
}
