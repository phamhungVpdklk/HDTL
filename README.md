# QLHS – Quản lý & Tạo lập Hồ sơ Dịch vụ

Phần mềm web full‑stack (React + Node + PostgreSQL) cho Văn phòng ĐKĐĐ Long Khánh.

## 1. Chạy nhanh bằng Docker

```bash
git clone <repo-url>
cd qlhs
docker compose up -d --build
```

| URL | Miêu tả |
|-----|---------|
| `http://localhost:3000` | Frontend React |
| `http://localhost:4000/api` | Backend API |
| `postgres://qlhs_user:StrongPass123@localhost:5432/qlhs_db` | CSDL |

## 2. Chạy cục bộ

### 2.1 Backend

```bash
cd backend
cp .env.example .env   # điều chỉnh DB nếu cần
npm i
npx nodemon server.js
```

### 2.2 Frontend

```bash
cd frontend
npm i
npm start
```

## 3. Tùy chỉnh

* **Word templates**: đặt `hop-dong.docx`, `bien-ban-tl.docx` vào `backend/templates/`.
* **Logic giá**: sửa `backend/pricingLogic.js`.
* **Migrations**: chuyển SQL sang hệ thống ORM nếu cần.

Happy coding!
