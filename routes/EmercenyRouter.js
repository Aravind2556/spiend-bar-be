// routes/alertRouter.js
const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");

const {
    url,
    carvideRangeMin,
    carvideRangeMax,
    thoracicRangeMin,
    thoracicRangeMax,
    lumberRangeMin,
    lumberRangeMax,
    sacralRangeMin,
    sacralRangeMax,
    leftCarvideRangeMin,
    leftCarvideRangeMax,
    rightCarvideRangeMin,
    rightCarvideRangeMax,
    leftIliumRangeMin,
    leftIliumRangeMax,
    rightIliumRangeMin,
    rightIliumRangeMax
} = require('../utils/Range');

const { formatTimestamp } = require('../utils/Time')

require("dotenv").config();

const router = express.Router();

const POLL_INTERVAL_MS = process.env.POLL_INTERVAL_MS ? Number(process.env.POLL_INTERVAL_MS) : 5000;
const EMAIL_COOLDOWN_MS = process.env.EMAIL_COOLDOWN_MS ? Number(process.env.EMAIL_COOLDOWN_MS) : 60000;

let canSendEmail = true;

// EMAIL TRANSPORT (Gmail)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ALERT_EMAIL,
        pass: process.env.ALERT_EMAIL_PASSWORD
    }
});

async function sendAlertEmail(allFields) {
    // build rows: show all fields, only violated keys red+bold
    const rowsHtml = Object.keys(allFields)
        .filter(key => key !== "__meta") // remove meta row
        .map(key => {
            const val = allFields[key];
            const { min, max } = allFields.__meta[key];
            return `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 6px; font-weight:600;">${key}</td>
                <td style="padding:8px 6px;">
                    <span style="fontWeight : 800">
                        ${val}
                    </span>
                    <span style="color:#888; font-size:12px;"> (min: ${min}, max: ${max})</span>
                </td>
            </tr>
        `;
        })
        .join("");


    const htmlMessage = `
<div style="background:#f8f9fa;padding:18px;border-radius:10px;font-family:Arial, sans-serif;color:#333;max-width:700px;">
  <h2 style="color:#d9534f;text-align:center;margin:0 0 8px;">⚠ Sensor Alert Triggered</h2>
  <p style="text-align:center;font-size:13px;margin:0 0 14px;">
    One or more sensor values exceeded allowed ranges. See details below.
  </p>

  <div style="background:#fff;padding:10px;border-radius:6px;border:1px solid #ddd;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #ddd;">Sensor</th>
          <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #ddd;">Value</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
  <p style="margin-top:8px;font-size:12px;color:#777;text-align:center;">
    This is an automated alert. Please investigate immediately.
  </p>
</div>
`;

    try {
        await transporter.sendMail({
            from: process.env.ALERT_EMAIL,
            to: process.env.ALERT_TO,
            subject: "⚠ Spine Sensor Alert - Out of Range Detected",
            html: htmlMessage
        });

        console.log("📧 Alert Email Sent Successfully!");
        canSendEmail = false;
        setTimeout(() => {
            canSendEmail = true;
            console.log("✅ Email cooldown ended — emails enabled again.");
        }, EMAIL_COOLDOWN_MS);
    } catch (err) {
        console.error("❌ Email sending error:", err);
    }
}

async function checkData() {
    try {
        if (!url) {
            console.warn("⚠ No url configured in utils/Range.js");
            return;
        }

        const res = await axios.get(url);
        const data = res.data;

        if (!data?.feeds?.length) {
            console.log("⚠ No data found in ThinkSpeak feeds");
            return;
        }

        const recent = data.feeds[data.feeds.length - 1];

        // parse numbers & keep meta (min/max) to show in email
        const fields = {
            "Cervical": Number(recent.field1 || 0),
            "Thoracic": Number(recent.field2 || 0),
            "Lumbar": Number(recent.field3 || 0),
            "Sacrum": Number(recent.field4 || 0),
            "Left Clavicle": Number(recent.field5 || 0),
            "Right Clavicle": Number(recent.field6 || 0),
            "Left Ilium": Number(recent.field7 || 0),
            "Right Ilium": Number(recent.field8 || 0)
        };

        // include min/max meta for email display
        fields.__meta = {
            "Cervical": { min: carvideRangeMin, max: carvideRangeMax },
            "Thoracic": { min: thoracicRangeMin, max: thoracicRangeMax },
            "Lumbar": { min: lumberRangeMin, max: lumberRangeMax },
            "Sacrum": { min: sacralRangeMin, max: sacralRangeMax },
            "Left Clavicle": { min: leftCarvideRangeMin, max: leftCarvideRangeMax },
            "Right Clavicle": { min: rightCarvideRangeMin, max: rightCarvideRangeMax },
            "Left Ilium": { min: leftIliumRangeMin, max: leftIliumRangeMax },
            "Right Ilium": { min: rightIliumRangeMin, max: rightIliumRangeMax }
        };

        const ranges = {
            "Cervical": [carvideRangeMin, carvideRangeMax],
            "Thoracic": [thoracicRangeMin, thoracicRangeMax],
            "Lumbar": [lumberRangeMin, lumberRangeMax],
            "Sacrum": [sacralRangeMin, sacralRangeMax],
            "Left Clavicle": [leftCarvideRangeMin, leftCarvideRangeMax],
            "Right Clavicle": [rightCarvideRangeMin, rightCarvideRangeMax],
            "Left Ilium": [leftIliumRangeMin, leftIliumRangeMax],
            "Right Ilium": [rightIliumRangeMin, rightIliumRangeMax]
        };

        // find violated keys (value < min || value > max)
        const violatedKeys = Object.keys(fields).filter(key => {
            if (key === "__meta") return false;
            const value = fields[key];
            const [min, max] = ranges[key] || [undefined, undefined];
            if (typeof min !== "number" || typeof max !== "number") return false;
            return (value < min || value > max);
        });

        if (violatedKeys.length > 0) {

            console.log("🚨 Violation(s) found:", violatedKeys, "→ sending email with all fields (violated in red)");
            if (canSendEmail) {
                await sendAlertEmail(fields, violatedKeys);
            } else {
                console.log("⏳ Cooldown active → Email skipped");
            }
        } else {
            console.log("✔ All values within allowed ranges");
        }

    } catch (err) {
        console.error("❌ ThinkSpeak fetch error:", err?.message || err);
    }
}

if (url) {
    console.log(`✔ Polling ThinkSpeak every ${POLL_INTERVAL_MS} ms...`);
    setInterval(checkData, POLL_INTERVAL_MS);
} else {
    console.warn("⚠ ThinkSpeak url is not set. Polling disabled.");
}

module.exports = router;
