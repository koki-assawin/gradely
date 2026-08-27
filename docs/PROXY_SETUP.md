Cloudflare Worker proxy — setup and usage for Gradely
===============================================

สรุป
----
ไฟล์นี้อธิบายวิธี deploy Cloudflare Worker proxy และการปรับ client เพื่อให้หน้าเว็บของคุณเรียก Worker แทนการพึ่ง public CORS proxies (api.allorigins, codetabs, corsproxy) ซึ่งมักจะไม่เสถียรหรือถูกบล็อกโดย CORS

ไฟล์ที่เพิ่มใน repo
- cloudflare-worker/proxy-worker.js  - โค้ด Worker ที่เอาไว้ deploy
- client/gradely-proxy-client.js     - helper client function (fetchKeyPlaintext) ที่เรียก Worker

การ deploy (Cloudflare Dashboard - แบบเร็ว)
1. สร้างบัญชีที่ https://dash.cloudflare.com/ แล้วไปที่เมนู Workers
2. Create Service -> Create a Worker
3. วางเนื้อหาไฟล์ cloudflare-worker/proxy-worker.js ลงใน editor
4. ปรับค่า ALLOWED_ORIGINS ในไฟล์ให้เป็นโดเมนของคุณ เช่น ['https://koki-assawin.github.io']
5. Save & Deploy
6. คุณจะได้ Worker URL เช่น: https://your-worker-subdomain.workers.dev

แก้ไขฝั่ง client
1. เปิดไฟล์ client/gradely-proxy-client.js และแก้ค่าตัวแปร PROXY_BASE ให้ชี้ไปยัง Worker URL ที่ได้
2. แทนที่การเรียก public proxies ใดๆ (api.allorigins.win, api.codetabs.com, corsproxy.io ฯลฯ) ให้เรียก fetchKeyPlaintext(remoteUrl) จากไฟล์นี้
   - ตัวอย่าง: const plaintext = await fetchKeyPlaintext(googleExportUrl)
3. ทดสอบโดยเปิด DevTools -> Network และคลิกปุ่ม "เริ่มตรวจการบ้านด้วย AI" ให้แน่ใจว่า Request ไปที่ your-worker-subdomain.workers.dev และได้ response 200

ทดสอบโดยตรง
- เรียกในเบราว์เซอร์:
  https://your-worker-subdomain.workers.dev/?url=<ENCODED_GOOGLE_EXPORT_URL>
- ควรได้เนื้อหาแบบ plaintext และ header Access-Control-Allow-Origin ถูกตั้งค่า

ข้อควรระวังด้านความปลอดภัย
- โค้ด Worker นี้จำกัดแค่ Origin เท่านั้น (ALLOWED_ORIGINS). หากตั้ง ALLOWED_ORIGINS = ['*'] จะกลายเป็น open proxy — หลีกเลี่ยง
- หากต้องการป้องกันเพิ่มเติม ให้ใช้ token-based auth (client ต้องได้ token มาจาก backend ของคุณ) หรือจำกัดเฉพาะ target host/ID
- หลีกเลี่ยงการเก็บ API keys ของผู้ให้บริการ AI ใน client-side หรือใน Google Docs ที่ทุกคนเข้าถึงได้ — ควรเก็บใน server-side environment variable และให้ server เป็นคนเรียก API ผู้ให้บริการ AI

ถ้าต้องการให้ผมช่วยต่อ
- ผมสามารถแก้โค้ดในไฟล์จริงของคุณให้ (ทำ PR) ถ้าคุณทำ repo เป็น public หรือให้ผมสิทธิ collaborator
- หรือคุณ deploy Worker แล้วส่ง URL ให้ผม ผมจะให้ snippet client ที่ต้องแทนในไฟล์ gradely.js ให้ตรงกับตำแหน่งเดิม

หากต้องการ patch เพิ่มเติม (เช่น แทรกโค้ดเข้าไฟล์ gradely.js โดยตรง) ให้ส่งไฟล์ gradely.js ที่มีฟังก์ชันเดิมมา — ผมจะแก้ให้และ commit เป็น patch ต่อไป
