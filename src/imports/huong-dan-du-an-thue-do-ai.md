# Hướng dẫn xây dựng Marketplace Cho Thuê Đồ tích hợp AI

**Stack:** Java + Spring Boot (Spring Tool Suite) + Oracle SQL

---

## 1. Tổng quan hệ thống

### 1.1 Ý tưởng cốt lõi
Nền tảng cho phép người dùng **đăng đồ cho thuê** (váy dạ hội, máy ảnh, đồ cắm trại...) và người khác **thuê theo khoảng ngày**. Hai điểm nhấn AI:

1. **Gợi ý sản phẩm theo sự kiện**: khách nhập loại sự kiện (đám cưới, dã ngoại, chụp ảnh...) → AI gợi ý các món đồ phù hợp.
2. **Dự đoán tình trạng còn hàng**: dựa trên lịch sử đặt thuê, hệ thống cảnh báo ngày nào món đồ có khả năng cao đã được đặt hoặc gợi ý ngày thay thế.

### 1.2 Đối tượng người dùng
- **Người thuê (Renter)**: tìm, đặt thuê đồ.
- **Người cho thuê (Owner/Lender)**: đăng sản phẩm, quản lý lịch cho thuê.
- **Admin**: duyệt sản phẩm, quản lý người dùng, xem thống kê.

---

## 2. Kiến trúc tổng thể

```
┌─────────────────┐        ┌──────────────────────┐        ┌───────────────┐
│  Frontend        │──HTTP──▶│  Spring Boot Backend │──JDBC──▶│  Oracle DB     │
│  (Thymeleaf hoặc │        │  (REST API)          │        │                │
│   React riêng)   │        │                      │        │                │
└─────────────────┘        └─────────┬────────────┘        └───────────────┘
                                      │
                                      │ gọi API ngoài
                                      ▼
                          ┌───────────────────────┐
                          │  AI Service            │
                          │  (OpenAI/Claude API    │
                          │   hoặc model tự train) │
                          └───────────────────────┘
```

### Gợi ý công nghệ cụ thể
| Thành phần | Công nghệ |
|---|---|
| Backend framework | Spring Boot 3.x |
| ORM | Spring Data JPA + Hibernate |
| Database | Oracle SQL (Oracle XE bản free để dev) |
| Bảo mật | Spring Security + JWT |
| Build tool | Maven |
| Frontend (nếu tách riêng) | React hoặc Vue; nếu làm nhanh gọn dùng Thymeleaf + Bootstrap |
| Gọi AI | Java `RestTemplate`/`WebClient` gọi API OpenAI hoặc Anthropic |
| Lên lịch dự đoán tồn kho | `Spring Scheduler` + logic thống kê, hoặc Python microservice nếu muốn dùng ML thực sự |

---

## 3. Thiết kế cơ sở dữ liệu (Oracle SQL)

### 3.1 Danh sách bảng chính

**USERS** — người dùng
```sql
CREATE TABLE USERS (
  USER_ID       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  FULL_NAME     VARCHAR2(150) NOT NULL,
  EMAIL         VARCHAR2(150) UNIQUE NOT NULL,
  PASSWORD_HASH VARCHAR2(255) NOT NULL,
  PHONE         VARCHAR2(20),
  ROLE          VARCHAR2(20) DEFAULT 'RENTER', -- RENTER, OWNER, ADMIN
  CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP
);
```

**CATEGORIES** — danh mục đồ cho thuê
```sql
CREATE TABLE CATEGORIES (
  CATEGORY_ID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  NAME          VARCHAR2(100) NOT NULL,
  DESCRIPTION   VARCHAR2(500)
);
```

**ITEMS** — sản phẩm cho thuê
```sql
CREATE TABLE ITEMS (
  ITEM_ID       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  OWNER_ID      NUMBER REFERENCES USERS(USER_ID),
  CATEGORY_ID   NUMBER REFERENCES CATEGORIES(CATEGORY_ID),
  TITLE         VARCHAR2(200) NOT NULL,
  DESCRIPTION   CLOB,
  DAILY_PRICE   NUMBER(10,2) NOT NULL,
  DEPOSIT       NUMBER(10,2) DEFAULT 0,
  STATUS        VARCHAR2(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, PENDING
  CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP
);
```

**ITEM_IMAGES**
```sql
CREATE TABLE ITEM_IMAGES (
  IMAGE_ID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ITEM_ID    NUMBER REFERENCES ITEMS(ITEM_ID),
  IMAGE_URL  VARCHAR2(500)
);
```

**RENTALS** — đơn thuê
```sql
CREATE TABLE RENTALS (
  RENTAL_ID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ITEM_ID       NUMBER REFERENCES ITEMS(ITEM_ID),
  RENTER_ID     NUMBER REFERENCES USERS(USER_ID),
  START_DATE    DATE NOT NULL,
  END_DATE      DATE NOT NULL,
  TOTAL_PRICE   NUMBER(10,2),
  STATUS        VARCHAR2(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, ONGOING, COMPLETED, CANCELLED
  EVENT_TYPE    VARCHAR2(100), -- dùng cho gợi ý AI: WEDDING, CAMPING, PHOTOSHOOT...
  CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP
);
```

**ITEM_AVAILABILITY** — lịch bận của từng món đồ (phục vụ dự đoán)
```sql
CREATE TABLE ITEM_AVAILABILITY (
  AVAIL_ID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ITEM_ID    NUMBER REFERENCES ITEMS(ITEM_ID),
  DATE_      DATE NOT NULL,
  IS_BOOKED  NUMBER(1) DEFAULT 0 -- 0 = trống, 1 = đã đặt
);
```

**REVIEWS**
```sql
CREATE TABLE REVIEWS (
  REVIEW_ID  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  RENTAL_ID  NUMBER REFERENCES RENTALS(RENTAL_ID),
  RATING     NUMBER(1) CHECK (RATING BETWEEN 1 AND 5),
  COMMENT    VARCHAR2(1000),
  CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
);
```

**EVENT_ITEM_SUGGESTIONS** — bảng lưu ánh xạ gợi ý AI theo sự kiện (cache lại để đỡ gọi API nhiều lần)
```sql
CREATE TABLE EVENT_ITEM_SUGGESTIONS (
  SUGGESTION_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  EVENT_TYPE    VARCHAR2(100),
  CATEGORY_ID   NUMBER REFERENCES CATEGORIES(CATEGORY_ID),
  SCORE         NUMBER(5,2) -- độ phù hợp
);
```

### 3.2 Quan hệ chính
- 1 User (Owner) → nhiều Items
- 1 Item → nhiều Rentals, nhiều ItemAvailability
- 1 Rental → 1 Review
- Category ↔ EventType: quan hệ nhiều-nhiều thông qua bảng gợi ý

---

## 4. Chi tiết 2 tính năng AI

### 4.1 Gợi ý sản phẩm theo sự kiện

**Cách làm đơn giản (khuyến nghị cho đồ án, dễ triển khai với Java):**

1. Khách chọn loại sự kiện trên giao diện (dropdown: Đám cưới, Cắm trại, Chụp ảnh, Sinh nhật, Dã ngoại...).
2. Backend gọi API của LLM (OpenAI/Claude) với prompt dạng:
   ```
   Bạn là trợ lý gợi ý đồ cho thuê. Sự kiện: "Đám cưới ngoài trời".
   Từ danh sách category sau: [Váy dạ hội, Máy ảnh, Loa, Bàn ghế, Rạp cưới, Đèn trang trí],
   hãy chọn ra 5 category phù hợp nhất và xếp hạng theo độ liên quan (JSON only).
   ```
3. Parse JSON trả về, map với bảng `CATEGORIES`, hiển thị sản phẩm thuộc các category đó (ưu tiên category điểm cao trước).
4. Lưu kết quả vào `EVENT_ITEM_SUGGESTIONS` để lần sau không cần gọi lại API (cache).

**Code minh hoạ gọi API bằng Java (Spring WebClient):**
```java
@Service
public class AiSuggestionService {

    private final WebClient webClient = WebClient.builder()
        .baseUrl("https://api.anthropic.com/v1/messages")
        .build();

    public List<String> suggestCategories(String eventType, List<String> categories) {
        String prompt = "Sự kiện: " + eventType +
            ". Từ danh sách: " + categories +
            ", chọn 5 category phù hợp nhất, trả về JSON array tên category, không giải thích thêm.";

        Map<String, Object> body = Map.of(
            "model", "claude-sonnet-4-6",
            "max_tokens", 300,
            "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        // gọi API, parse response.content[0].text thành List<String>
        // dùng Jackson ObjectMapper để parse JSON trả về
        ...
    }
}
```
> Lưu ý: cần xử lý trường hợp AI trả về không đúng JSON — nên có logic fallback (nếu parse lỗi thì trả về gợi ý mặc định theo rule cứng).

**Phương án nâng cao hơn (nếu muốn thể hiện ML thực sự):**
Xây bảng `EVENT_ITEM_SUGGESTIONS` từ dữ liệu lịch sử thực tế (thống kê category nào được thuê nhiều nhất theo `EVENT_TYPE` đã lưu trong `RENTALS`), kết hợp content-based filtering đơn giản bằng cosine similarity giữa mô tả sự kiện và mô tả sản phẩm.

### 4.2 Dự đoán tình trạng còn hàng

**Cách 1 — Rule-based đơn giản, dễ code trong Java (khuyến nghị chính):**
- Với mỗi item, lấy lịch sử đặt thuê từ `ITEM_AVAILABILITY`.
- Tính "tỷ lệ lấp đầy" theo từng thứ trong tuần / theo mùa (VD: cuối tuần luôn kín từ tháng trước).
- Nếu khách chọn ngày trùng với ngày có tỷ lệ lấp đầy lịch sử > 70%, hệ thống cảnh báo: *"Ngày này thường hết hàng sớm, bạn nên đặt trước hoặc chọn ngày khác"* và gợi ý 2-3 ngày trống gần nhất.

```java
public class AvailabilityPredictor {
    public double calcBookingRate(Long itemId, DayOfWeek day) {
        // query ITEM_AVAILABILITY, đếm số ngày IS_BOOKED=1 trên tổng số ngày cùng loại thứ
        // trả về tỷ lệ %
    }

    public List<LocalDate> suggestAlternativeDates(Long itemId, LocalDate wanted) {
        // quét ITEM_AVAILABILITY quanh ngày wanted, trả về các ngày IS_BOOKED=0
    }
}
```

**Cách 2 — Dùng thư viện ML (nếu muốn nâng điểm kỹ thuật):**
Tách một microservice Python nhỏ (Flask/FastAPI) dùng `scikit-learn` (Logistic Regression hoặc Random Forest) để dự đoán xác suất đã bị đặt dựa trên: thứ trong tuần, tháng, số ngày trước sự kiện lớn (lễ, tết), lịch sử đặt của item. Java backend gọi sang microservice này qua REST.

---

## 5. Thiết kế API (REST endpoints chính)

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập (trả JWT) |
| GET | `/api/items` | Danh sách sản phẩm (filter theo category, giá) |
| GET | `/api/items/{id}` | Chi tiết sản phẩm |
| POST | `/api/items` | Đăng sản phẩm (Owner) |
| GET | `/api/items/{id}/availability?month=` | Xem lịch trống |
| POST | `/api/rentals` | Tạo đơn thuê |
| GET | `/api/rentals/my` | Đơn thuê của tôi |
| PUT | `/api/rentals/{id}/status` | Cập nhật trạng thái (Owner/Admin) |
| POST | `/api/ai/suggest-by-event` | Gợi ý sản phẩm theo sự kiện |
| GET | `/api/ai/predict-availability?itemId=&date=` | Dự đoán khả năng còn hàng |
| POST | `/api/reviews` | Đánh giá sau khi thuê |

---

## 6. Lộ trình triển khai đề xuất (6 tuần)

| Tuần | Nội dung |
|---|---|
| 1 | Thiết kế DB Oracle, dựng project Spring Boot, cấu hình kết nối DB, tạo Entity/Repository |
| 2 | Chức năng Auth (đăng ký/đăng nhập + JWT), CRUD Items, Categories |
| 3 | Chức năng đặt thuê (Rentals), quản lý lịch (ItemAvailability), tính giá tự động |
| 4 | Tích hợp AI gợi ý theo sự kiện (gọi API LLM + cache kết quả) |
| 5 | Tính năng dự đoán tồn kho (rule-based), hoàn thiện Reviews, trang Admin |
| 6 | Làm giao diện hoàn chỉnh, test toàn bộ luồng, viết báo cáo, chuẩn bị demo |

---

## 7. Lưu ý kỹ thuật khi dùng Oracle với Spring Boot

- Dùng driver: `com.oracle.database.jdbc:ojdbc11` trong `pom.xml`.
- Cấu hình `application.properties`:
```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:XE
spring.datasource.username=your_user
spring.datasource.password=your_password
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
spring.jpa.database-platform=org.hibernate.dialect.OracleDialect
spring.jpa.hibernate.ddl-auto=update
```
- Oracle không có kiểu `AUTO_INCREMENT` như MySQL — dùng `GENERATED ALWAYS AS IDENTITY` (Oracle 12c+) như các bảng ở trên.
- Kiểu `BOOLEAN` không tồn tại trong Oracle — dùng `NUMBER(1)` (0/1) như trong `IS_BOOKED`.

---

## 8. Gợi ý demo khi báo cáo/bảo vệ đồ án
1. Demo luồng đăng sản phẩm (Owner) → duyệt (Admin) → hiển thị (Renter).
2. Demo tính năng nổi bật nhất: nhập "Đám cưới ngoài trời" → AI trả về gợi ý category/sản phẩm ngay lập tức.
3. Demo cảnh báo "ngày này thường hết hàng" khi chọn ngày cuối tuần.
4. Trình bày sơ đồ kiến trúc + ERD để giám khảo thấy rõ tư duy hệ thống.

---

Nếu bạn muốn, mình có thể giúp tiếp:
- Viết chi tiết Entity/Repository/Controller mẫu cho 1-2 module đầu (Auth, Items)
- Vẽ sơ đồ ERD trực quan
- Viết prompt chi tiết hơn cho phần gọi AI
