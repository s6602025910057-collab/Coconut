# Coconut Orchard Dashboard

แดชบอร์ดสวนมะพร้าวภาษาไทย สร้างด้วย Next.js App Router, React, TypeScript และ Supabase

## เริ่มใช้งาน

ต้องใช้ Node.js 20.9 ขึ้นไป

```sh
npm ci
npm run dev
```

เปิด http://localhost:3000

เชื่อมต่อ Supabase **Coconut** (`ynxgbgoqyxoibkjzckfm`) และ `public.storage` ไว้แล้วใน `lib/config.ts` โดยใช้ publishable/anon key สำหรับอ่านข้อมูลเท่านั้น ไม่มี service-role key ใน repository

หากต้องการเปลี่ยนโปรเจกต์ คัดลอก `.env.example` เป็น `.env.local` และตั้งค่า URL / publishable key ใหม่ ตัวแปร `NEXT_PUBLIC_*` เป็นข้อมูลสาธารณะและถูกฝังใน browser bundle ตอน build ห้ามใช้ secret หรือ service-role key

## ฟีเจอร์

- ค่าล่าสุดของ `temp air`, `hum soil`, `hum air`, `electric wind`
- รีเฟรชทุก 30 วินาที เปิด/ปิดได้ และรีเฟรชด้วยปุ่ม
- กราฟ interactive: ชี้/แตะดูค่าและ ID, ซูมเข้า/ออก, เลือกช่วงด้วย slider, คืนช่วงทั้งหมด และใช้ลูกศรคีย์บอร์ดเลือกจุด
- โหลด 100 / 500 / 1,000 รายการล่าสุด และสรุป min / max / average ของข้อมูลที่โหลด
- ตารางแบ่งหน้า และดาวน์โหลดข้อมูลที่โหลดเป็น CSV
- รองรับมือถือ พร้อมแสดงสถานะ loading, empty, error และค่าขาดหาย
- ไม่มีข้อมูลจำลอง ไม่แปลง null เป็น 0

ใช้ °C สำหรับอุณหภูมิ และ % สำหรับความชื้น โดยอุปกรณ์ต้องส่งค่าที่ปรับเทียบแล้ว หากส่ง raw ADC ต้องแปลงค่าก่อนแสดงผล `electric wind` ยังไม่ระบุหน่วย จึงแสดงค่าดิบโดยไม่เดาหน่วย

## ฐานข้อมูลและการเข้าถึง

ตารางเดิมมี `id` bigint identity primary key และอีก 4 คอลัมน์ double precision ชื่อคอลัมน์มีช่องว่างตาม schema เดิม

Dashboard อ่านข้อมูลได้โดยไม่ต้อง login: มี RLS policy `dashboard_read_sensor_data` สำหรับ SELECT โดย role `anon` เท่านั้น ข้อมูลเซ็นเซอร์ในตารางนี้จึงเปิดให้อ่านสาธารณะผ่าน Data API ไม่มี policy อนุญาต INSERT / UPDATE / DELETE แก่ anon ห้ามใส่ข้อมูลส่วนตัวในตารางนี้ หากต้องการ dashboard ส่วนตัว ต้องเปลี่ยน policy และเพิ่ม authentication

SQL ที่ใช้ตั้งค่าสิทธิ์บันทึกใน `supabase/dashboard-read.sql` และถูกใช้ในโปรเจกต์แล้ว ไม่ต้องรันซ้ำ

ตารางยังไม่มี timestamp กราฟจึงใช้ ID เป็นแกน X และค่าล่าสุดหมายถึง ID สูงสุด เวลา “ตรวจสอบล่าสุด” คือเวลาที่ dashboard อ่านข้อมูลสำเร็จ ไม่ใช่เวลาเซ็นเซอร์วัด

## ตรวจสอบ

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Deploy

Import repository นี้ใน Vercel เลือก framework Next.js และใช้ `npm run build` ค่าเชื่อมต่อสาธารณะของ Coconut มีค่าเริ่มต้นไว้แล้ว จึงไม่ต้องตั้ง secret เพื่ออ่านตารางนี้ สามารถ override ด้วยตัวแปรใน `.env.example` ได้

GitHub repository เป็น source code และยังไม่ใช่ URL เว็บที่ deploy แล้ว
