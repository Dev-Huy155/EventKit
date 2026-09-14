import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Screen = "explore" | "detail" | "owner";
type Role = "renter" | "owner";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface Item {
  id: number;
  ownerId: number;
  ownerName: string;
  category: string;
  title: string;
  description: string;
  dailyPrice: number;
  deposit: number;
  location: string;
  rating: number;
  reviewCount: number;
  img: string;
  tags: string[];
  status: "ACTIVE" | "INACTIVE" | "PENDING";
}

interface Rental {
  id: string;
  itemId: number;
  itemTitle: string;
  renterId: number;
  renterName: string;
  ownerId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  deposit: number;
  status: "PENDING" | "CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  eventType?: string;
  createdAt: string;
}

interface Review {
  id: number;
  rentalId: string;
  itemId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface Notification {
  id: number;
  message: string;
  read: boolean;
  time: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const USERS: User[] = [
  { id: 1, name: "Tuấn Anh", email: "tuananh@mail.com", role: "owner", avatar: "T" },
  { id: 2, name: "Minh Châu", email: "minhchau@mail.com", role: "owner", avatar: "M" },
  { id: 3, name: "Thu Hiền", email: "thuhien@mail.com", role: "renter", avatar: "H" },
];

const SEED_ITEMS: Item[] = [
  {
    id: 1, ownerId: 2, ownerName: "Minh Châu", category: "Váy & Đầm",
    title: "Váy dạ hội đuôi cá Elara", description: "Váy đuôi cá dòng premium, vải lụa Ý nhập khẩu, size S–L. Kèm phụ kiện cài tóc đính đá. Phù hợp dạ tiệc, đám cưới, sự kiện sang trọng.",
    dailyPrice: 450000, deposit: 1500000, location: "TP.HCM", rating: 4.9, reviewCount: 38,
    img: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=750&fit=crop&auto=format",
    tags: ["Đám cưới", "Dạ tiệc"], status: "ACTIVE",
  },
  {
    id: 2, ownerId: 1, ownerName: "Tuấn Anh", category: "Máy ảnh",
    title: "Sony A7 IV + Ống kính 50mm f/1.8", description: "Full-frame mirrorless 33MP, kèm pin dự phòng, túi đựng chuyên dụng, thẻ nhớ 256GB. Phù hợp chụp ảnh cưới, sự kiện, phong cảnh.",
    dailyPrice: 650000, deposit: 8000000, location: "Hà Nội", rating: 4.8, reviewCount: 62,
    img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=750&fit=crop&auto=format",
    tags: ["Chụp ảnh", "Video"], status: "ACTIVE",
  },
  {
    id: 3, ownerId: 2, ownerName: "Minh Châu", category: "Đồ cắm trại",
    title: "Bộ lều cắm trại 4 người Naturehike", description: "Lều 3 mùa, chịu gió cấp 7, setup nhanh 10 phút. Kèm thảm lót sàn và túi ngủ cho 2 người.",
    dailyPrice: 280000, deposit: 1200000, location: "Đà Lạt", rating: 4.7, reviewCount: 25,
    img: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=750&fit=crop&auto=format",
    tags: ["Cắm trại", "Dã ngoại"], status: "ACTIVE",
  },
  {
    id: 4, ownerId: 1, ownerName: "Tuấn Anh", category: "Âm thanh",
    title: "Loa JBL Xtreme 3 — Công suất 100W", description: "Pin 15h liên tục, chống nước IP67, kết nối Bluetooth 5.1, hỗ trợ Party Mode nối nhiều loa.",
    dailyPrice: 180000, deposit: 800000, location: "TP.HCM", rating: 4.6, reviewCount: 41,
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=750&fit=crop&auto=format",
    tags: ["Sinh nhật", "Sự kiện"], status: "ACTIVE",
  },
  {
    id: 5, ownerId: 1, ownerName: "Tuấn Anh", category: "Phụ kiện chụp ảnh",
    title: "Bộ đèn flash studio 3 đèn Godox", description: "3 đèn AD300Pro, softbox 80×80cm, octabox 95cm, giá đỡ, remote kích nổ. Lý tưởng cho studio mini.",
    dailyPrice: 350000, deposit: 3000000, location: "Hà Nội", rating: 4.8, reviewCount: 19,
    img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=750&fit=crop&auto=format",
    tags: ["Chụp ảnh", "Studio"], status: "ACTIVE",
  },
  {
    id: 6, ownerId: 2, ownerName: "Minh Châu", category: "Váy & Đầm",
    title: "Áo dài cách tân Phượng Hoàng", description: "Gấm tơ tằm Vạn Phúc thêu tay, size XS–XL. Có thể order chỉnh sửa theo số đo trong vòng 24h.",
    dailyPrice: 320000, deposit: 900000, location: "Hà Nội", rating: 4.9, reviewCount: 53,
    img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=750&fit=crop&auto=format",
    tags: ["Tết", "Đám cưới", "Lễ hội"], status: "ACTIVE",
  },
];

const SEED_RENTALS: Rental[] = [
  { id: "R-1042", itemId: 2, itemTitle: "Sony A7 IV + 50mm", renterId: 3, renterName: "Thu Hiền", ownerId: 1, startDate: "2026-09-14", endDate: "2026-09-16", totalPrice: 1300000, deposit: 8000000, status: "ONGOING", eventType: "Chụp ảnh", createdAt: "2026-09-10" },
  { id: "R-1039", itemId: 5, itemTitle: "Bộ đèn flash Godox", renterId: 3, renterName: "Thu Hiền", ownerId: 1, startDate: "2026-09-10", endDate: "2026-09-10", totalPrice: 350000, deposit: 3000000, status: "COMPLETED", eventType: "Studio", createdAt: "2026-09-07" },
  { id: "R-1045", itemId: 2, itemTitle: "Sony A7 IV + 50mm", renterId: 3, renterName: "Trần Bảo Châu", ownerId: 1, startDate: "2026-09-20", endDate: "2026-09-22", totalPrice: 1300000, deposit: 8000000, status: "PENDING", eventType: "Đám cưới", createdAt: "2026-09-13" },
  { id: "R-1046", itemId: 5, itemTitle: "Bộ đèn flash Godox", renterId: 3, renterName: "Lê Văn Đức", ownerId: 1, startDate: "2026-09-21", endDate: "2026-09-21", totalPrice: 350000, deposit: 3000000, status: "PENDING", eventType: "Chụp ảnh", createdAt: "2026-09-13" },
  { id: "R-1035", itemId: 2, itemTitle: "Sony A7 IV + 50mm", renterId: 3, renterName: "Hoàng Yến Nhi", ownerId: 1, startDate: "2026-09-01", endDate: "2026-09-03", totalPrice: 1300000, deposit: 8000000, status: "COMPLETED", eventType: "Chụp ảnh", createdAt: "2026-08-28" },
];

const SEED_REVIEWS: Review[] = [
  { id: 1, rentalId: "R-1035", itemId: 2, reviewerName: "Hoàng Yến Nhi", rating: 5, comment: "Sản phẩm đúng mô tả, chủ nhiệt tình, giao hàng đúng giờ. Rất hài lòng!", date: "04/09/2026" },
  { id: 2, rentalId: "R-1039", itemId: 5, reviewerName: "Thu Hiền", rating: 5, comment: "Chất lượng tuyệt vời, sẽ thuê lại lần sau.", date: "11/09/2026" },
  { id: 3, rentalId: "R-1039", itemId: 2, reviewerName: "Phạm Bảo Long", rating: 4, comment: "Oke, đúng như mô tả. Giao hàng hơi trễ 30 phút nhưng chủ có báo trước.", date: "25/08/2026" },
];

const REVENUE_DATA = [
  { month: "T4", revenue: 2100000 }, { month: "T5", revenue: 3200000 },
  { month: "T6", revenue: 2800000 }, { month: "T7", revenue: 4100000 },
  { month: "T8", revenue: 3750000 }, { month: "T9", revenue: 4850000 },
];

const EVENT_TYPES = ["Đám cưới", "Cắm trại / Dã ngoại", "Chụp ảnh", "Sinh nhật", "Dã ngoại", "Tết / Lễ hội"];
const AI_MAP: Record<string, string[]> = {
  "Đám cưới": ["Váy & Đầm", "Máy ảnh", "Âm thanh", "Phụ kiện chụp ảnh"],
  "Cắm trại / Dã ngoại": ["Đồ cắm trại", "Âm thanh", "Máy ảnh"],
  "Chụp ảnh": ["Máy ảnh", "Phụ kiện chụp ảnh", "Váy & Đầm"],
  "Sinh nhật": ["Âm thanh", "Máy ảnh", "Váy & Đầm"],
  "Dã ngoại": ["Đồ cắm trại", "Âm thanh", "Máy ảnh"],
  "Tết / Lễ hội": ["Váy & Đầm", "Âm thanh", "Máy ảnh"],
};

const CATEGORIES = ["Váy & Đầm", "Máy ảnh", "Đồ cắm trại", "Âm thanh", "Phụ kiện chụp ảnh"];

// September 2026 booked dates per item
const BOOKED: Record<number, number[]> = { 2: [14, 15, 16, 20, 21, 22], 5: [10, 21] };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

function daysBetween(a: string, b: string) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function toDisplayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function genId() {
  return "R-" + Math.floor(1000 + Math.random() * 9000);
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function Stars({ n, interactive, onChange }: { n: number; interactive?: boolean; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`text-lg transition-colors ${interactive ? "cursor-pointer" : ""} ${(hover || n) >= i ? "text-amber-500" : "text-[#D4BFA8]"}`}
        >★</span>
      ))}
    </span>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: "Chờ duyệt",   cls: "bg-amber-100 text-amber-800" },
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-100 text-blue-800" },
    ONGOING:   { label: "Đang thuê",   cls: "bg-emerald-100 text-emerald-800" },
    COMPLETED: { label: "Hoàn thành",  cls: "bg-gray-100 text-gray-500" },
    CANCELLED: { label: "Đã hủy",      cls: "bg-red-100 text-red-700" },
    ACTIVE:    { label: "Hoạt động",   cls: "bg-emerald-100 text-emerald-700" },
    INACTIVE:  { label: "Ẩn",          cls: "bg-gray-100 text-gray-500" },
    PENDING_ITEM: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-800" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  const cls = {
    success: "bg-[#2A1F1A] text-white",
    error:   "bg-red-600 text-white",
    info:    "bg-[#2A1F1A] text-white",
    warning: "bg-amber-600 text-white",
  };
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm pointer-events-auto ${cls[t.type]} animate-[slideIn_0.25s_ease]`}
          style={{ animation: "slideIn 0.25s ease" }}
        >
          <span className="font-mono">{icons[t.type]}</span>
          <span>{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="ml-2 opacity-70 hover:opacity-100 text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2A1F1A]/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#F7F3EE] rounded-3xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AuthModal({ open, onClose, onAuth }: {
  open: boolean; onClose: () => void; onAuth: (user: User) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("renter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    setTimeout(() => {
      const u = USERS.find((u) => u.email === email);
      if (!u || password !== "123456") { setError("Email hoặc mật khẩu không đúng."); setLoading(false); return; }
      onAuth(u); setLoading(false);
    }, 800);
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    setTimeout(() => {
      const newUser: User = { id: Date.now(), name, email, role, avatar: name[0]?.toUpperCase() || "U" };
      USERS.push(newUser);
      onAuth(newUser); setLoading(false);
    }, 800);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8">
        <div className="text-center mb-6">
          <span className="text-[#C4602A] text-3xl font-display font-semibold italic">Mượn.</span>
          <p className="text-sm text-[#8C7B72] mt-1">Marketplace cho thuê đồ thông minh</p>
        </div>
        <div className="flex rounded-xl bg-[#EDE7DF] p-1 mb-6">
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow text-[#2A1F1A]" : "text-[#8C7B72]"}`}>
              {t === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">EMAIL</label>
              <input required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tuananh@mail.com"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">MẬT KHẨU</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <p className="text-xs text-[#8C7B72]">Demo: <strong>tuananh@mail.com</strong> / <strong>123456</strong> (Owner) hoặc <strong>thuhien@mail.com</strong> / <strong>123456</strong> (Renter)</p>
            <button type="submit" disabled={loading}
              className="bg-[#C4602A] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#A34D1F] transition-colors disabled:opacity-60">
              {loading && <Spinner />} Đăng nhập
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">HỌ TÊN</label>
              <input required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">EMAIL</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">MẬT KHẨU</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-2">VAI TRÒ</label>
              <div className="grid grid-cols-2 gap-2">
                {(["renter", "owner"] as const).map((r) => (
                  <button type="button" key={r} onClick={() => setRole(r)}
                    className={`py-3 rounded-xl text-sm border-2 transition-all ${role === r ? "border-[#C4602A] bg-[#C4602A]/5 text-[#C4602A] font-medium" : "border-[#D4BFA8] text-[#6B5347]"}`}>
                    {r === "renter" ? "🛒 Người thuê" : "🏠 Người cho thuê"}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="bg-[#C4602A] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#A34D1F] transition-colors disabled:opacity-60">
              {loading && <Spinner />} Đăng ký
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function MessageModal({ open, onClose, ownerName, onSend }: {
  open: boolean; onClose: () => void; ownerName: string; onSend: () => void;
}) {
  const [msg, setMsg] = useState("");
  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    onSend(); setMsg(""); onClose();
  }
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8">
        <h2 className="font-display text-2xl text-[#2A1F1A] mb-1">Nhắn tin</h2>
        <p className="text-sm text-[#8C7B72] mb-5">Gửi tin nhắn tới chủ <strong>{ownerName}</strong></p>
        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <textarea required rows={4} value={msg} onChange={(e) => setMsg(e.target.value)}
            placeholder="Xin chào, tôi muốn hỏi thêm về sản phẩm..."
            className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors resize-none" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#D4BFA8] text-[#6B5347] py-3 rounded-xl text-sm hover:border-[#6B5347] transition-colors">
              Hủy
            </button>
            <button type="submit" className="flex-1 bg-[#C4602A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#A34D1F] transition-colors">
              Gửi tin nhắn
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function BookingModal({ open, onClose, item, startDate, endDate, onConfirm, user }: {
  open: boolean; onClose: () => void; item: Item;
  startDate: string; endDate: string;
  onConfirm: (eventType: string) => void;
  user: User | null;
}) {
  const [eventType, setEventType] = useState("");
  const [agree, setAgree] = useState(false);
  const days = daysBetween(startDate, endDate) || 1;
  const rental = days * item.dailyPrice;
  const service = Math.round(rental * 0.05);

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="p-8">
        <h2 className="font-display text-2xl text-[#2A1F1A] mb-5">Xác nhận đặt thuê</h2>
        <div className="flex gap-4 mb-5 p-4 bg-white rounded-2xl border border-[#EDE7DF]">
          <img src={item.img} alt={item.title} className="w-20 h-20 object-cover rounded-xl bg-[#EDE7DF] shrink-0" />
          <div>
            <p className="text-xs font-mono text-[#8C7B72] mb-1">{item.category}</p>
            <h3 className="font-display text-[#2A1F1A] text-lg leading-tight">{item.title}</h3>
            <p className="text-xs text-[#8C7B72] mt-1">📍 {item.location} · Chủ: {item.ownerName}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#EDE7DF] rounded-xl p-3">
            <p className="text-xs font-mono text-[#8C7B72] mb-1">NGÀY BẮT ĐẦU</p>
            <p className="font-semibold text-[#2A1F1A]">{toDisplayDate(startDate)}</p>
          </div>
          <div className="bg-[#EDE7DF] rounded-xl p-3">
            <p className="text-xs font-mono text-[#8C7B72] mb-1">NGÀY KẾT THÚC</p>
            <p className="font-semibold text-[#2A1F1A]">{toDisplayDate(endDate)}</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">LOẠI SỰ KIỆN (TÙY CHỌN)</label>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors">
            <option value="">-- Chọn sự kiện --</option>
            {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="bg-white rounded-2xl border border-[#EDE7DF] p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[#6B5347]">{fmt(item.dailyPrice)} × {days} ngày</span><span className="font-mono">{fmt(rental)}</span></div>
          <div className="flex justify-between"><span className="text-[#6B5347]">Đặt cọc (hoàn trả khi trả đồ)</span><span className="font-mono">{fmt(item.deposit)}</span></div>
          <div className="flex justify-between"><span className="text-[#6B5347]">Phí dịch vụ (5%)</span><span className="font-mono">{fmt(service)}</span></div>
          <div className="flex justify-between font-semibold border-t border-[#EDE7DF] pt-2">
            <span>Tổng thanh toán</span>
            <span className="text-[#C4602A] font-mono">{fmt(rental + item.deposit + service)}</span>
          </div>
        </div>
        <label className="flex items-start gap-3 mb-5 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#C4602A]" />
          <span className="text-xs text-[#6B5347]">Tôi đồng ý với <span className="underline cursor-pointer text-[#C4602A]">điều khoản dịch vụ</span> và cam kết trả đồ đúng hạn, nguyên vẹn.</span>
        </label>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#D4BFA8] text-[#6B5347] py-3 rounded-xl text-sm hover:border-[#6B5347] transition-colors">Hủy</button>
          <button onClick={() => agree && user && onConfirm(eventType)}
            disabled={!agree || !user}
            className="flex-1 bg-[#C4602A] text-white py-3 rounded-xl font-semibold hover:bg-[#A34D1F] transition-colors disabled:opacity-40">
            {!user ? "Đăng nhập để đặt thuê" : "Xác nhận đặt thuê"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ReviewModal({ open, onClose, rental, onSubmit }: {
  open: boolean; onClose: () => void; rental: Rental | null;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(rating, comment); setComment(""); setRating(5); onClose();
  }
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-8">
        <h2 className="font-display text-2xl text-[#2A1F1A] mb-2">Đánh giá</h2>
        <p className="text-sm text-[#8C7B72] mb-5">{rental?.itemTitle}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono text-[#8C7B72] block mb-2">XẾP HẠNG</label>
            <Stars n={rating} interactive onChange={setRating} />
          </div>
          <div>
            <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">NHẬN XÉT</label>
            <textarea required rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-[#D4BFA8] text-[#6B5347] py-3 rounded-xl text-sm hover:border-[#6B5347] transition-colors">Hủy</button>
            <button type="submit" className="flex-1 bg-[#C4602A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#A34D1F] transition-colors">Gửi đánh giá</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD / EDIT LISTING MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ListingModal({ open, onClose, existing, onSave }: {
  open: boolean; onClose: () => void; existing?: Item | null;
  onSave: (data: Partial<Item>) => void;
}) {
  const [form, setForm] = useState<Partial<Item>>(existing ?? {
    title: "", category: CATEGORIES[0], description: "", dailyPrice: 0, deposit: 0, location: "", tags: [], status: "ACTIVE",
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setForm(existing ?? { title: "", category: CATEGORIES[0], description: "", dailyPrice: 0, deposit: 0, location: "", tags: [], status: "ACTIVE" });
  }, [existing, open]);

  function set(k: keyof Item, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }
  function addTag() { if (tagInput.trim()) { set("tags", [...(form.tags || []), tagInput.trim()]); setTagInput(""); } }
  function removeTag(t: string) { set("tags", (form.tags || []).filter((x) => x !== t)); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form); onClose();
  }

  const IMGS = [
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=750&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=750&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=750&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=750&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=750&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=750&fit=crop&auto=format",
  ];

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="p-8">
        <h2 className="font-display text-2xl text-[#2A1F1A] mb-5">{existing ? "Chỉnh sửa sản phẩm" : "Đăng sản phẩm mới"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">TÊN SẢN PHẨM *</label>
              <input required value={form.title ?? ""} onChange={(e) => set("title", e.target.value)}
                placeholder="VD: Váy dạ hội đuôi cá Elara"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">DANH MỤC *</label>
              <select required value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">ĐỊA ĐIỂM *</label>
              <input required value={form.location ?? ""} onChange={(e) => set("location", e.target.value)}
                placeholder="TP.HCM / Hà Nội..."
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">GIÁ THUÊ / NGÀY (₫) *</label>
              <input required type="number" min={0} value={form.dailyPrice ?? ""} onChange={(e) => set("dailyPrice", Number(e.target.value))}
                placeholder="450000"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">ĐẶT CỌC (₫)</label>
              <input type="number" min={0} value={form.deposit ?? ""} onChange={(e) => set("deposit", Number(e.target.value))}
                placeholder="1500000"
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">MÔ TẢ *</label>
              <textarea required rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
                placeholder="Mô tả chi tiết về sản phẩm, tình trạng, phụ kiện đi kèm..."
                className="w-full bg-white border border-[#D4BFA8] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C4602A] transition-colors resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-mono text-[#8C7B72] block mb-1.5">TAGS SỰ KIỆN</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {(form.tags || []).map((t) => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-[#EDE7DF] text-[#6B5347] px-2.5 py-1 rounded-full">
                    {t} <button type="button" onClick={() => removeTag(t)} className="text-[#8C7B72] hover:text-red-500">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Đám cưới, Sinh nhật..."
                  className="flex-1 bg-white border border-[#D4BFA8] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#C4602A] transition-colors" />
                <button type="button" onClick={addTag} className="px-4 py-2.5 border border-[#D4BFA8] rounded-xl text-sm text-[#6B5347] hover:border-[#C4602A] transition-colors">Thêm</button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-mono text-[#8C7B72] block mb-2">CHỌN ẢNH ĐẠI DIỆN</label>
              <div className="grid grid-cols-6 gap-2">
                {IMGS.map((img) => (
                  <button type="button" key={img} onClick={() => set("img", img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${form.img === img ? "border-[#C4602A]" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-[#D4BFA8] text-[#6B5347] py-3 rounded-xl text-sm hover:border-[#6B5347] transition-colors">Hủy</button>
            <button type="submit" className="flex-1 bg-[#C4602A] text-white py-3 rounded-xl font-semibold hover:bg-[#A34D1F] transition-colors">
              {existing ? "Lưu thay đổi" : "Đăng sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
function InteractiveCalendar({ itemId, startDate, endDate, onSelect }: {
  itemId: number; startDate: string; endDate: string;
  onSelect: (start: string, end: string) => void;
}) {
  const booked = BOOKED[itemId] ?? [];
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const startDay = startDate ? parseInt(startDate.split("-")[2]) : null;
  const endDay = endDate ? parseInt(endDate.split("-")[2]) : null;

  function isInRange(d: number) {
    if (!startDay) return false;
    const lo = startDay, hi = endDay ?? hoverDay ?? startDay;
    return d > Math.min(lo, hi) && d < Math.max(lo, hi);
  }

  function handleClick(d: number) {
    if (booked.includes(d)) return;
    if (selecting === "start") {
      onSelect(`2026-09-${String(d).padStart(2, "0")}`, "");
      setSelecting("end");
    } else {
      if (d <= (startDay ?? 0)) {
        onSelect(`2026-09-${String(d).padStart(2, "0")}`, "");
        setSelecting("end");
      } else {
        onSelect(startDate, `2026-09-${String(d).padStart(2, "0")}`);
        setSelecting("start");
      }
    }
  }

  const offset = 1; // Sep 2026 starts Tuesday

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#2A1F1A]">Tháng 9 / 2026</p>
        <span className="text-xs font-mono text-[#C4602A]">
          {selecting === "start" ? "→ Chọn ngày bắt đầu" : "→ Chọn ngày kết thúc"}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8C7B72] font-mono mb-2">
        {["CN","T2","T3","T4","T5","T6","T7"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const isBooked = booked.includes(d);
          const isStart = d === startDay;
          const isEnd = d === endDay;
          const inRange = isInRange(d);
          const today = d === 14;
          return (
            <button key={d} type="button"
              onClick={() => handleClick(d)}
              onMouseEnter={() => setHoverDay(d)}
              onMouseLeave={() => setHoverDay(null)}
              disabled={isBooked}
              className={`
                h-9 flex items-center justify-center rounded-lg text-sm transition-all
                ${isBooked ? "bg-[#C4602A]/15 text-[#C4602A] line-through cursor-not-allowed opacity-60" : "cursor-pointer"}
                ${(isStart || isEnd) ? "bg-[#C4602A] text-white font-semibold" : ""}
                ${inRange && !isBooked ? "bg-[#C4602A]/10 text-[#C4602A]" : ""}
                ${today && !isStart && !isEnd ? "ring-2 ring-[#C4602A] font-semibold" : ""}
                ${!isBooked && !isStart && !isEnd && !inRange ? "hover:bg-[#EDE7DF] text-[#2A1F1A]" : ""}
              `}
            >{d}</button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#8C7B72]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#C4602A]/20 inline-block" />Đã đặt</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#C4602A] inline-block" />Ngày chọn</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-2 ring-[#C4602A] inline-block" />Hôm nay</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV BAR
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ user, onAuthClick, onLogout, notifications, onNotifClick, unreadCount, screen, setScreen }: {
  user: User | null; onAuthClick: () => void; onLogout: () => void;
  notifications: Notification[]; onNotifClick: () => void; unreadCount: number;
  screen: Screen; setScreen: (s: Screen) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setNotifOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-[#F7F3EE]/90 backdrop-blur border-b border-[#D4BFA8]/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen("explore")}>
          <span className="text-[#C4602A] text-xl font-display font-semibold italic">Mượn.</span>
          <span className="text-xs font-mono text-[#8C7B72] bg-[#EDE7DF] px-2 py-0.5 rounded-full hidden sm:inline">AI-powered</span>
        </div>
        <div className="hidden md:flex items-center gap-5 text-sm text-[#6B5347]">
          <button onClick={() => setScreen("explore")} className={`hover:text-[#C4602A] transition-colors ${screen === "explore" ? "text-[#C4602A] font-medium" : ""}`}>Khám phá</button>
          {user?.role === "owner" && (
            <button onClick={() => setScreen("owner")} className={`hover:text-[#C4602A] transition-colors ${screen === "owner" ? "text-[#C4602A] font-medium" : ""}`}>Dashboard</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div ref={ref} className="relative">
                <button onClick={() => setNotifOpen((v) => !v)}
                  className="relative w-9 h-9 rounded-full bg-[#EDE7DF] flex items-center justify-center text-[#6B5347] hover:bg-[#D4BFA8] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#C4602A] text-white text-[9px] rounded-full flex items-center justify-center font-mono">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-xl border border-[#EDE7DF] overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#EDE7DF] flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#2A1F1A]">Thông báo</span>
                      <button onClick={onNotifClick} className="text-xs text-[#C4602A] hover:underline">Đánh dấu đã đọc</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#EDE7DF]">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-[#8C7B72] p-4 text-center">Không có thông báo mới</p>
                      ) : notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? "text-[#8C7B72]" : "text-[#2A1F1A] font-medium"}`}>
                          <p>{n.message}</p>
                          <p className="text-xs text-[#8C7B72] mt-0.5 font-mono">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C4602A]/20 flex items-center justify-center text-[#C4602A] text-sm font-semibold">{user.avatar}</div>
                <span className="text-sm text-[#2A1F1A] hidden sm:inline font-medium">{user.name}</span>
                <button onClick={onLogout} className="text-xs text-[#8C7B72] hover:text-[#C4602A] transition-colors ml-1">Đăng xuất</button>
              </div>
            </>
          ) : (
            <>
              <button onClick={onAuthClick} className="text-sm text-[#6B5347] hover:text-[#C4602A] transition-colors">Đăng nhập</button>
              <button onClick={onAuthClick} className="bg-[#C4602A] text-white text-sm px-4 py-2 rounded-full hover:bg-[#A34D1F] transition-colors">Đăng ký</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1 — EXPLORE
// ─────────────────────────────────────────────────────────────────────────────
function ExploreScreen({ items, onSelect, user, onAuthClick }: {
  items: Item[]; onSelect: (item: Item) => void; user: User | null; onAuthClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc" | "newest">("rating");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string[] | null>(null);

  function handleAI(event: string) {
    if (selectedEvent === event) { setSelectedEvent(null); setAiResult(null); return; }
    setSelectedEvent(event); setAiLoading(true); setAiResult(null);
    setTimeout(() => { setAiResult(AI_MAP[event] ?? []); setAiLoading(false); }, 1200);
  }

  const filtered = items
    .filter((i) => i.status === "ACTIVE")
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => catFilter ? i.category === catFilter : true)
    .filter((i) => aiResult ? aiResult.includes(i.category) : true)
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price_asc") return a.dailyPrice - b.dailyPrice;
      if (sortBy === "price_desc") return b.dailyPrice - a.dailyPrice;
      return b.id - a.id;
    });

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-10 grid md:grid-cols-[1fr_380px] gap-12 items-center">
        <div>
          <p className="text-xs font-mono text-[#C4602A] tracking-widest uppercase mb-4">✦ Marketplace cho thuê đồ</p>
          <h1 className="font-display text-5xl md:text-6xl text-[#2A1F1A] leading-tight mb-5">
            Thuê đồ thông minh,<br /><em>mọi dịp lễ hội</em>
          </h1>
          <p className="text-[#6B5347] text-lg leading-relaxed mb-8 max-w-md">
            AI gợi ý đồ phù hợp với sự kiện của bạn. Đặt theo ngày, nhận tại nhà, trả lại sau.
          </p>
          <div className="flex gap-3 max-w-lg">
            <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-[#D4BFA8] flex items-center gap-2 shadow-sm">
              <svg className="w-4 h-4 text-[#8C7B72] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input className="flex-1 bg-transparent text-sm outline-none text-[#2A1F1A] placeholder:text-[#8C7B72]"
                placeholder="Tìm váy dạ hội, máy ảnh, lều trại..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-[#EDE7DF]">
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=875&fit=crop&auto=format" alt="Váy dạ hội" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl p-4 shadow-lg border border-[#EDE7DF]">
            <p className="text-xs text-[#8C7B72] mb-1 font-mono">AI gợi ý cho bạn</p>
            <p className="text-sm font-semibold text-[#2A1F1A]">Đám cưới ngoài trời</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {["Váy & Đầm","Máy ảnh","Âm thanh"].map((t) => (
                <span key={t} className="text-[10px] bg-[#EDE7DF] text-[#6B5347] px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Event Bar */}
      <section className="bg-[#2A1F1A] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
            <div>
              <p className="text-xs font-mono text-[#7B9E87] tracking-widest uppercase mb-1">✦ Tính năng AI</p>
              <h2 className="font-display text-2xl text-white">Gợi ý theo sự kiện</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((ev) => (
                <button key={ev} onClick={() => handleAI(ev)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${selectedEvent === ev ? "bg-[#C4602A] border-[#C4602A] text-white" : "border-[#6B5347] text-[#D4BFA8] hover:border-[#C4602A] hover:text-white"}`}>
                  {ev}
                </button>
              ))}
            </div>
          </div>
          {(aiLoading || aiResult) && (
            <div className="p-4 rounded-2xl border border-[#6B5347]/40 bg-[#6B5347]/10">
              {aiLoading ? (
                <div className="flex items-center gap-3 text-[#D4BFA8]">
                  <Spinner /> <span className="text-sm font-mono">AI đang phân tích sự kiện "{selectedEvent}"...</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-[#7B9E87] mr-2">Kết quả AI cho "{selectedEvent}":</span>
                  {aiResult!.map((cat, i) => (
                    <button key={cat} onClick={() => setCatFilter(cat === catFilter ? null : cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${catFilter === cat ? "bg-[#C4602A] text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                      <span className="font-mono text-[#7B9E87] text-[10px]">#{i+1}</span>{cat}
                    </button>
                  ))}
                  <button onClick={() => { setAiResult(null); setSelectedEvent(null); setCatFilter(null); }}
                    className="px-3 py-1.5 text-sm text-[#8C7B72] hover:text-white transition-colors">✕ Xóa</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Filters + Sort */}
      <div className="max-w-7xl mx-auto px-6 pt-7 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap flex-1">
            <button onClick={() => setCatFilter(null)} className={`px-4 py-1.5 rounded-full text-sm border transition-all ${!catFilter ? "bg-[#2A1F1A] text-white border-[#2A1F1A]" : "border-[#D4BFA8] text-[#6B5347] hover:border-[#6B5347]"}`}>Tất cả</button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCatFilter(c === catFilter ? null : c)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${catFilter === c ? "bg-[#2A1F1A] text-white border-[#2A1F1A]" : "border-[#D4BFA8] text-[#6B5347] hover:border-[#6B5347]"}`}>
                {c}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-white border border-[#D4BFA8] rounded-xl px-4 py-2 text-sm text-[#6B5347] outline-none focus:border-[#C4602A] transition-colors">
            <option value="rating">Đánh giá cao nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="newest">Mới nhất</option>
          </select>
        </div>
        <p className="text-xs text-[#8C7B72] font-mono mt-3">{filtered.length} sản phẩm</p>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#8C7B72]">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-display text-xl text-[#2A1F1A] mb-2">Không tìm thấy sản phẩm</p>
            <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <article key={item.id} onClick={() => onSelect(item)}
                className="group bg-white rounded-3xl overflow-hidden border border-[#EDE7DF] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden bg-[#EDE7DF]">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-[#8C7B72] uppercase tracking-wider mb-1">{item.category}</p>
                      <h3 className="font-display text-[#2A1F1A] text-lg leading-snug truncate">{item.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[#C4602A] font-semibold">{fmt(item.dailyPrice)}</p>
                      <p className="text-[10px] text-[#8C7B72]">/ngày</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Stars n={item.rating} />
                    <span className="text-xs text-[#8C7B72] font-mono">{item.rating} ({item.reviewCount})</span>
                    <span className="text-[#D4BFA8] text-xs">·</span>
                    <span className="text-xs text-[#8C7B72]">📍 {item.location}</span>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {item.tags.map((t) => (
                      <span key={t} className="text-[11px] bg-[#F7F3EE] text-[#6B5347] px-2.5 py-0.5 rounded-full border border-[#EDE7DF]">{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 2 — ITEM DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function DetailScreen({ item, onBack, reviews, user, onBookingConfirm, onAuthClick }: {
  item: Item; onBack: () => void; reviews: Review[];
  user: User | null; onBookingConfirm: (rental: Omit<Rental, "id" | "createdAt">) => void;
  onAuthClick: () => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [aiChecked, setAiChecked] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiWarning, setAiWarning] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  const booked = BOOKED[item.id] ?? [];
  const days = daysBetween(startDate, endDate) || 1;
  const rental = days * item.dailyPrice;
  const service = Math.round(rental * 0.05);
  const itemReviews = reviews.filter((r) => r.itemId === item.id);

  function checkAI() {
    if (!startDate) return;
    setAiLoading(true); setAiChecked(false);
    setTimeout(() => {
      const d = parseInt(startDate.split("-")[2]);
      setAiWarning(booked.includes(d) || booked.includes(d + 1) || booked.includes(d - 1));
      setAiChecked(true); setAiLoading(false);
    }, 900);
  }

  function handleSelect(start: string, end: string) {
    setStartDate(start); setEndDate(end); setAiChecked(false);
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_400px] gap-10">
        {/* LEFT */}
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#6B5347] hover:text-[#C4602A] transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại danh sách
          </button>

          {/* Gallery */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="col-span-2 aspect-[4/3] rounded-3xl overflow-hidden bg-[#EDE7DF]">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex-1 rounded-2xl overflow-hidden bg-[#EDE7DF] opacity-80">
                <img src={item.img} alt="" className="w-full h-full object-cover grayscale" />
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden bg-[#EDE7DF] opacity-50">
                <img src={item.img} alt="" className="w-full h-full object-cover grayscale" />
              </div>
            </div>
          </div>

          {/* Meta */}
          <p className="text-xs font-mono text-[#8C7B72] uppercase tracking-widest mb-2">{item.category}</p>
          <h1 className="font-display text-4xl text-[#2A1F1A] mb-3">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B5347] mb-6">
            <span className="flex items-center gap-1.5"><Stars n={item.rating} /><span className="font-mono">{item.rating}</span><span className="text-[#8C7B72]">({item.reviewCount})</span></span>
            <span className="text-[#D4BFA8]">·</span>
            <span>📍 {item.location}</span>
            <span className="text-[#D4BFA8]">·</span>
            <span>Chủ: <strong>{item.ownerName}</strong></span>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDE7DF] mb-5">
            <h2 className="font-display text-xl text-[#2A1F1A] mb-3">Mô tả sản phẩm</h2>
            <p className="text-[#6B5347] leading-relaxed">{item.description}</p>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-[#EDE7DF]">
              <div>
                <p className="text-xs text-[#8C7B72] font-mono mb-1">GIÁ THUÊ / NGÀY</p>
                <p className="font-mono text-[#C4602A] font-bold text-2xl">{fmt(item.dailyPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-[#8C7B72] font-mono mb-1">ĐẶT CỌC (HOÀN TRẢ)</p>
                <p className="font-mono text-[#2A1F1A] font-bold text-2xl">{fmt(item.deposit)}</p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDE7DF] mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-[#2A1F1A]">Chọn ngày thuê</h2>
              <span className="text-xs font-mono text-[#7B9E87] bg-[#7B9E87]/10 px-2.5 py-1 rounded-full">✦ AI dự đoán tồn kho</span>
            </div>
            <InteractiveCalendar itemId={item.id} startDate={startDate} endDate={endDate} onSelect={handleSelect} />
            {startDate && endDate && (
              <div className="mt-4 p-3 bg-[#F7F3EE] rounded-xl text-sm flex items-center justify-between">
                <span className="text-[#6B5347]">Đã chọn: <strong>{toDisplayDate(startDate)}</strong> → <strong>{toDisplayDate(endDate)}</strong> ({days} ngày)</span>
                <button onClick={checkAI} disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs text-[#C4602A] font-medium hover:underline disabled:opacity-50">
                  {aiLoading ? <Spinner /> : "✦"} Kiểm tra AI
                </button>
              </div>
            )}
            {aiChecked && (
              <div className={`mt-3 p-4 rounded-xl text-sm border ${aiWarning ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                {aiWarning ? (
                  <><p className="font-semibold text-amber-800 mb-1">⚠️ Ngày này thường hết sớm!</p>
                  <p className="text-amber-700 text-xs">Tỷ lệ lấp đầy lịch sử &gt;80%. Thử ngày 17–18/09 hoặc 23–25/09 thay thế.</p></>
                ) : (
                  <><p className="font-semibold text-emerald-800 mb-1">✓ Lịch trống cho khoảng ngày này</p>
                  <p className="text-emerald-700 text-xs">AI xác nhận khả năng còn hàng cao. Đặt ngay để giữ chỗ.</p></>
                )}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDE7DF]">
            <h2 className="font-display text-xl text-[#2A1F1A] mb-5">Đánh giá ({itemReviews.length})</h2>
            {itemReviews.length === 0 ? (
              <p className="text-sm text-[#8C7B72]">Chưa có đánh giá nào.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {itemReviews.map((r) => (
                  <div key={r.id} className="pb-5 border-b border-[#EDE7DF] last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#EDE7DF] flex items-center justify-center text-sm font-semibold text-[#6B5347]">{r.reviewerName[0]}</div>
                        <span className="text-sm font-medium text-[#2A1F1A]">{r.reviewerName}</span>
                      </div>
                      <span className="text-xs text-[#8C7B72] font-mono">{r.date}</span>
                    </div>
                    <Stars n={r.rating} />
                    <p className="text-sm text-[#6B5347] mt-1.5 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Booking Panel */}
        <div className="lg:sticky lg:top-20 h-fit flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-[#EDE7DF] p-6 shadow-lg">
            <div className="flex items-baseline gap-2 mb-5">
              <span className="font-mono text-[#C4602A] text-2xl font-bold">{fmt(item.dailyPrice)}</span>
              <span className="text-[#8C7B72] text-sm">/ngày</span>
            </div>
            <div className="bg-[#F7F3EE] rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#8C7B72] font-mono text-xs">NGÀY BẮT ĐẦU</span>
                <span className="font-medium text-[#2A1F1A]">{startDate ? toDisplayDate(startDate) : <span className="text-[#8C7B72]">Chưa chọn</span>}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C7B72] font-mono text-xs">NGÀY KẾT THÚC</span>
                <span className="font-medium text-[#2A1F1A]">{endDate ? toDisplayDate(endDate) : <span className="text-[#8C7B72]">Chưa chọn</span>}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C7B72] font-mono text-xs">SỐ NGÀY</span>
                <span className="font-medium text-[#2A1F1A]">{startDate && endDate ? `${days} ngày` : "—"}</span>
              </div>
            </div>
            <div className="border-t border-[#EDE7DF] pt-4 mb-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-[#6B5347]">{fmt(item.dailyPrice)} × {days} ngày</span><span className="font-mono">{fmt(rental)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B5347]">Đặt cọc</span><span className="font-mono">{fmt(item.deposit)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B5347]">Phí dịch vụ (5%)</span><span className="font-mono">{fmt(service)}</span></div>
              <div className="flex justify-between font-semibold border-t border-[#EDE7DF] pt-2">
                <span>Tổng thanh toán</span>
                <span className="font-mono text-[#C4602A]">{fmt(rental + item.deposit + service)}</span>
              </div>
            </div>
            <button
              onClick={() => { if (!user) { onAuthClick(); return; } if (!startDate || !endDate) return; setShowBooking(true); }}
              disabled={!startDate || !endDate}
              className="w-full bg-[#C4602A] text-white py-3.5 rounded-xl font-semibold hover:bg-[#A34D1F] transition-colors disabled:opacity-40">
              {!user ? "Đăng nhập để đặt thuê" : !startDate || !endDate ? "Chọn ngày trên lịch" : "Đặt thuê ngay"}
            </button>
            <p className="text-center text-xs text-[#8C7B72] mt-2">Chưa bị trừ tiền. Chủ cần xác nhận trước.</p>
          </div>

          {/* Owner card */}
          <div className="bg-white rounded-2xl border border-[#EDE7DF] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#C4602A]/10 flex items-center justify-center text-lg font-semibold text-[#C4602A]">{item.ownerName[0]}</div>
              <div>
                <p className="font-semibold text-[#2A1F1A]">{item.ownerName}</p>
                <p className="text-xs text-[#8C7B72]">Phản hồi trong ~2 giờ · 98% tích cực</p>
              </div>
            </div>
            <button onClick={() => { if (!user) { onAuthClick(); return; } setMsgOpen(true); }}
              className="w-full border border-[#D4BFA8] text-[#6B5347] py-2.5 rounded-xl text-sm hover:border-[#C4602A] hover:text-[#C4602A] transition-colors">
              {msgSent ? "✓ Đã gửi tin nhắn" : "Nhắn tin cho chủ"}
            </button>
          </div>
        </div>
      </div>

      <BookingModal open={showBooking} onClose={() => setShowBooking(false)} item={item} startDate={startDate} endDate={endDate} user={user}
        onConfirm={(eventType) => {
          onBookingConfirm({ itemId: item.id, itemTitle: item.title, renterId: user!.id, renterName: user!.name, ownerId: item.ownerId, startDate, endDate, totalPrice: rental, deposit: item.deposit, status: "PENDING", eventType });
          setShowBooking(false); setStartDate(""); setEndDate(""); setAiChecked(false);
        }} />
      <MessageModal open={msgOpen} onClose={() => setMsgOpen(false)} ownerName={item.ownerName} onSend={() => setMsgSent(true)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 3 — OWNER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function OwnerDashboard({ user, items, rentals, reviews, onRentalUpdate, onItemSave, onItemDelete, addNotification }: {
  user: User; items: Item[]; rentals: Rental[]; reviews: Review[];
  onRentalUpdate: (id: string, status: Rental["status"]) => void;
  onItemSave: (data: Partial<Item>, existing?: Item) => void;
  onItemDelete: (id: number) => void;
  addNotification: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "rentals" | "reviews">("overview");
  const [listingModal, setListingModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [rentalFilter, setRentalFilter] = useState<string>("ALL");
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewRental, setReviewRental] = useState<Rental | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const myItems = items.filter((i) => i.ownerId === user.id);
  const myRentals = rentals.filter((r) => r.ownerId === user.id);
  const myReviews = reviews.filter((r) => myItems.some((i) => i.id === r.itemId));

  const totalRevenue = myRentals.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.totalPrice, 0);
  const pending = myRentals.filter((r) => r.status === "PENDING").length;
  const ongoing = myRentals.filter((r) => r.status === "ONGOING").length;
  const avgRating = myReviews.length ? (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1) : "—";

  const filteredRentals = rentalFilter === "ALL" ? myRentals : myRentals.filter((r) => r.status === rentalFilter);

  function handleApprove(id: string) { onRentalUpdate(id, "CONFIRMED"); addNotification("Đã xác nhận đơn thuê " + id); }
  function handleReject(id: string) { onRentalUpdate(id, "CANCELLED"); addNotification("Đã từ chối đơn thuê " + id); }
  function handleComplete(id: string) { onRentalUpdate(id, "COMPLETED"); addNotification("Đã hoàn thành đơn thuê " + id); }

  const tabs = [
    { id: "overview" as const, label: "Tổng quan", icon: "◈" },
    { id: "listings" as const, label: "Sản phẩm", icon: "◧" },
    { id: "rentals" as const, label: "Đơn thuê", icon: "◫", badge: pending },
    { id: "reviews" as const, label: "Đánh giá", icon: "◉" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} bg-[#2A1F1A] flex flex-col transition-all duration-200 min-h-screen hidden md:flex shrink-0`}>
        <div className="p-5 border-b border-[#6B5347]/30">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#C4602A] text-xl font-display font-semibold italic">Mượn.</span>
                  <span className="text-[10px] font-mono text-[#7B9E87] bg-[#7B9E87]/10 px-1.5 py-0.5 rounded">Owner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#C4602A]/20 flex items-center justify-center text-[#C4602A] font-semibold text-sm">{user.avatar}</div>
                  <div>
                    <p className="text-white text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-[#8C7B72] text-xs">{user.email}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-[#6B5347] hover:text-white p-1">‹</button>
            </div>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-full bg-[#C4602A]/20 flex items-center justify-center text-[#C4602A] font-semibold text-sm mx-auto">
              {user.avatar}
            </button>
          )}
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all relative ${activeTab === t.id ? "bg-[#C4602A] text-white" : "text-[#8C7B72] hover:text-white hover:bg-white/5"}`}>
              <span className="font-mono shrink-0">{t.icon}</span>
              {sidebarOpen && <span>{t.label}</span>}
              {t.badge ? <span className="ml-auto bg-white/20 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full">{t.badge}</span> : null}
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-[#6B5347]/30">
            <button onClick={() => { setEditItem(null); setListingModal(true); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#7B9E87] hover:text-white hover:bg-white/5 transition-colors w-full`}>
              <span className="shrink-0">＋</span>
              {sidebarOpen && "Đăng sản phẩm mới"}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="sticky top-0 z-20 bg-[#F7F3EE]/90 backdrop-blur border-b border-[#D4BFA8]/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-[#2A1F1A]">{tabs.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-[#8C7B72] font-mono">Tháng 9, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            {pending > 0 && <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />{pending} đơn chờ duyệt</div>}
            <button onClick={() => { setEditItem(null); setListingModal(true); }}
              className="bg-[#C4602A] text-white text-sm px-4 py-2 rounded-full hover:bg-[#A34D1F] transition-colors">
              + Đăng sản phẩm
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Doanh thu tháng 9", value: fmt(totalRevenue), sub: "+12% so tháng 8", color: "text-[#C4602A]" },
                  { label: "Đơn đang xử lý", value: String(pending + ongoing), sub: `${pending} chờ duyệt · ${ongoing} đang thuê`, color: "text-amber-600" },
                  { label: "Sản phẩm đăng", value: String(myItems.filter(i => i.status === "ACTIVE").length), sub: "Đang hoạt động", color: "text-[#7B9E87]" },
                  { label: "Đánh giá TB", value: avgRating + " ★", sub: `Từ ${myReviews.length} đánh giá`, color: "text-[#2A1F1A]" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#EDE7DF]">
                    <p className="text-xs font-mono text-[#8C7B72] uppercase tracking-wider mb-2">{s.label}</p>
                    <p className={`font-display text-2xl font-semibold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-[#8C7B72] mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue chart */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDE7DF]">
                <h3 className="font-display text-lg text-[#2A1F1A] mb-4">Doanh thu 6 tháng gần nhất</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C4602A" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#C4602A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DF" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8C7B72", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => (v / 1000000).toFixed(1) + "M"} tick={{ fontSize: 11, fill: "#8C7B72", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [fmt(Number(v)), "Doanh thu"]} contentStyle={{ borderRadius: 12, border: "1px solid #EDE7DF", fontFamily: "Outfit" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#C4602A" strokeWidth={2} fill="url(#grad)" dot={{ fill: "#C4602A", r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* AI Insights */}
              <div className="bg-[#2A1F1A] rounded-2xl p-6">
                <p className="text-xs font-mono text-[#7B9E87] tracking-widest uppercase mb-2">✦ AI Insights</p>
                <h3 className="font-display text-white text-xl mb-4">Dự đoán & Đề xuất</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { title: "Cuối tuần 27–28/09", pred: "Tỷ lệ lấp đầy dự kiến 92%", action: "Cân nhắc tăng giá 10–15%", col: "border-[#C4602A]/30 bg-[#C4602A]/5" },
                    { title: "Sony A7 IV", pred: "Nhu cầu tăng — mùa cưới", action: "3 đơn đặt trước tiềm năng", col: "border-[#7B9E87]/30 bg-[#7B9E87]/5" },
                    { title: "Đèn flash Godox", pred: "Lịch trống 15–19/09", action: "Thêm ưu đãi để lấp lịch", col: "border-[#D4BFA8]/30 bg-[#D4BFA8]/5" },
                  ].map((i) => (
                    <div key={i.title} className={`rounded-xl p-4 border ${i.col}`}>
                      <p className="font-semibold text-white text-sm mb-1">{i.title}</p>
                      <p className="text-[#D4BFA8] text-xs mb-2">{i.pred}</p>
                      <p className="text-[#7B9E87] text-xs font-mono">→ {i.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent rentals */}
              <div className="bg-white rounded-2xl border border-[#EDE7DF] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#EDE7DF] flex items-center justify-between">
                  <h3 className="font-display text-lg text-[#2A1F1A]">Đơn gần đây</h3>
                  <button onClick={() => setActiveTab("rentals")} className="text-sm text-[#C4602A] hover:underline">Xem tất cả →</button>
                </div>
                <div className="divide-y divide-[#EDE7DF]">
                  {myRentals.slice(0, 4).map((r) => (
                    <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono text-[#8C7B72] shrink-0">{r.id}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#2A1F1A] truncate">{r.renterName}</p>
                          <p className="text-xs text-[#8C7B72] truncate">{r.itemTitle} · {toDisplayDate(r.startDate)}–{toDisplayDate(r.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-sm text-[#2A1F1A]">{fmt(r.totalPrice)}</span>
                        <Badge status={r.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LISTINGS */}
          {activeTab === "listings" && (
            <div>
              <div className="grid md:grid-cols-2 gap-5">
                {myItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-[#EDE7DF] overflow-hidden">
                    <div className="aspect-[16/9] overflow-hidden bg-[#EDE7DF] relative">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3"><Badge status={item.status} /></div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-mono text-[#8C7B72] mb-1">{item.category}</p>
                          <h3 className="font-display text-lg text-[#2A1F1A] leading-tight">{item.title}</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-[#EDE7DF] mb-4 text-center">
                        <div><p className="text-[10px] text-[#8C7B72] font-mono">GIÁ/NGÀY</p><p className="text-sm font-semibold text-[#C4602A] font-mono">{fmt(item.dailyPrice)}</p></div>
                        <div><p className="text-[10px] text-[#8C7B72] font-mono">ĐÁNH GIÁ</p><p className="text-sm font-semibold text-[#2A1F1A]">{item.rating} ★</p></div>
                        <div><p className="text-[10px] text-[#8C7B72] font-mono">LƯỢT THUÊ</p><p className="text-sm font-semibold text-[#2A1F1A]">{item.reviewCount}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditItem(item); setListingModal(true); }}
                          className="flex-1 border border-[#D4BFA8] text-[#6B5347] text-sm py-2 rounded-xl hover:border-[#C4602A] hover:text-[#C4602A] transition-colors">Chỉnh sửa</button>
                        <button onClick={() => { if (confirm("Xóa sản phẩm này?")) { onItemDelete(item.id); addNotification("Đã xóa sản phẩm: " + item.title); } }}
                          className="px-4 border border-[#D4BFA8] text-[#8C7B72] text-sm py-2 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors">Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div onClick={() => { setEditItem(null); setListingModal(true); }}
                  className="bg-white rounded-2xl border-2 border-dashed border-[#D4BFA8] flex flex-col items-center justify-center min-h-[260px] hover:border-[#C4602A] transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-[#F7F3EE] group-hover:bg-[#C4602A]/10 flex items-center justify-center mb-3 transition-colors">
                    <svg className="w-6 h-6 text-[#8C7B72] group-hover:text-[#C4602A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#6B5347] group-hover:text-[#C4602A] transition-colors">Đăng sản phẩm mới</p>
                  <p className="text-xs text-[#8C7B72] mt-1">Thêm đồ cho thuê</p>
                </div>
              </div>
            </div>
          )}

          {/* RENTALS */}
          {activeTab === "rentals" && (
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                {[["ALL","Tất cả"],["PENDING","Chờ duyệt"],["CONFIRMED","Đã xác nhận"],["ONGOING","Đang thuê"],["COMPLETED","Hoàn thành"],["CANCELLED","Đã hủy"]].map(([v, l]) => (
                  <button key={v} onClick={() => setRentalFilter(v)}
                    className={`px-4 py-1.5 rounded-full text-sm border transition-all ${rentalFilter === v ? "bg-[#2A1F1A] text-white border-[#2A1F1A]" : "border-[#D4BFA8] text-[#6B5347] hover:border-[#6B5347]"}`}>
                    {l} {v !== "ALL" && <span className="font-mono text-xs ml-1">({myRentals.filter(r => r.status === v).length})</span>}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-[#EDE7DF] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#EDE7DF] bg-[#F7F3EE]">
                        {["Mã đơn","Sản phẩm","Người thuê","Thời gian","Sự kiện","Tổng tiền","Trạng thái","Hành động"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-mono text-[#8C7B72] uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE7DF]">
                      {filteredRentals.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#8C7B72]">Không có đơn nào</td></tr>
                      ) : filteredRentals.map((r) => (
                        <tr key={r.id} className="hover:bg-[#F7F3EE] transition-colors">
                          <td className="px-4 py-3.5 text-xs font-mono text-[#8C7B72]">{r.id}</td>
                          <td className="px-4 py-3.5 text-sm text-[#2A1F1A] max-w-[160px]"><p className="truncate">{r.itemTitle}</p></td>
                          <td className="px-4 py-3.5 text-sm text-[#2A1F1A] whitespace-nowrap">{r.renterName}</td>
                          <td className="px-4 py-3.5 text-xs font-mono text-[#6B5347] whitespace-nowrap">{toDisplayDate(r.startDate)} → {toDisplayDate(r.endDate)}</td>
                          <td className="px-4 py-3.5 text-xs text-[#8C7B72]">{r.eventType || "—"}</td>
                          <td className="px-4 py-3.5 text-sm font-mono text-[#2A1F1A] whitespace-nowrap">{fmt(r.totalPrice)}</td>
                          <td className="px-4 py-3.5"><Badge status={r.status} /></td>
                          <td className="px-4 py-3.5">
                            {r.status === "PENDING" && (
                              <div className="flex gap-1.5">
                                <button onClick={() => handleApprove(r.id)} className="text-xs bg-[#7B9E87] text-white px-3 py-1.5 rounded-lg hover:bg-[#6B8E76] transition-colors whitespace-nowrap">Duyệt</button>
                                <button onClick={() => handleReject(r.id)} className="text-xs border border-[#D4BFA8] text-[#6B5347] px-3 py-1.5 rounded-lg hover:border-red-400 hover:text-red-600 transition-colors whitespace-nowrap">Từ chối</button>
                              </div>
                            )}
                            {r.status === "CONFIRMED" && (
                              <button onClick={() => handleComplete(r.id)} className="text-xs bg-[#2A1F1A] text-white px-3 py-1.5 rounded-lg hover:bg-[#3D2E26] transition-colors whitespace-nowrap">Hoàn thành</button>
                            )}
                            {(r.status === "COMPLETED" || r.status === "CANCELLED") && (
                              <span className="text-xs text-[#8C7B72]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === "reviews" && (
            <div>
              <div className="grid md:grid-cols-3 gap-5 mb-6">
                {[
                  { label: "Đánh giá TB", value: avgRating + " ★", sub: `${myReviews.length} đánh giá` },
                  { label: "5 sao", value: String(myReviews.filter(r => r.rating === 5).length), sub: "lượt" },
                  { label: "Phản hồi", value: "98%", sub: "tích cực" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#EDE7DF] text-center">
                    <p className="text-xs font-mono text-[#8C7B72] uppercase tracking-wider mb-2">{s.label}</p>
                    <p className="font-display text-3xl font-semibold text-[#2A1F1A]">{s.value}</p>
                    <p className="text-xs text-[#8C7B72] mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-[#EDE7DF] divide-y divide-[#EDE7DF]">
                {myReviews.length === 0 ? (
                  <p className="p-8 text-center text-sm text-[#8C7B72]">Chưa có đánh giá nào.</p>
                ) : myReviews.map((r) => (
                  <div key={r.id} className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EDE7DF] flex items-center justify-center text-sm font-semibold text-[#6B5347]">{r.reviewerName[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-[#2A1F1A]">{r.reviewerName}</p>
                          <p className="text-xs text-[#8C7B72]">{myItems.find(i => i.id === r.itemId)?.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Stars n={r.rating} />
                        <p className="text-xs text-[#8C7B72] font-mono mt-0.5">{r.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#6B5347] leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <ListingModal open={listingModal} onClose={() => { setListingModal(false); setEditItem(null); }} existing={editItem}
        onSave={(data) => { onItemSave(data, editItem ?? undefined); addNotification(editItem ? "Đã cập nhật: " + data.title : "Đã đăng sản phẩm: " + data.title); }} />
      <ReviewModal open={reviewModal} onClose={() => setReviewModal(false)} rental={reviewRental}
        onSubmit={(rating, comment) => { addNotification("Đã gửi đánh giá!"); }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("explore");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [items, setItems] = useState<Item[]>(SEED_ITEMS);
  const [rentals, setRentals] = useState<Rental[]>(SEED_RENTALS);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: "Đơn R-1045 đang chờ bạn xác nhận", read: false, time: "5 phút trước" },
    { id: 2, message: "Đơn R-1046 vừa được đặt mới", read: false, time: "12 phút trước" },
    { id: 3, message: "Thu Hiền vừa đánh giá 5★ đơn R-1039", read: true, time: "2 giờ trước" },
  ]);

  const toastId = useRef(0);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  function dismissToast(id: number) { setToasts((t) => t.filter((x) => x.id !== id)); }

  function addNotification(msg: string) {
    const id = Date.now();
    setNotifications((n) => [{ id, message: msg, read: false, time: "Vừa xong" }, ...n]);
    addToast(msg);
  }

  function markAllRead() { setNotifications((n) => n.map((x) => ({ ...x, read: true }))); }

  function handleAuth(u: User) {
    setUser(u); setAuthOpen(false);
    addToast(`Chào mừng ${u.name}! 👋`, "success");
    if (u.role === "owner") setTimeout(() => setScreen("owner"), 600);
  }

  function handleLogout() {
    setUser(null); setScreen("explore");
    addToast("Đã đăng xuất", "info");
  }

  function handleSelect(item: Item) { setSelectedItem(item); setScreen("detail"); }

  function handleBookingConfirm(data: Omit<Rental, "id" | "createdAt">) {
    const r: Rental = { ...data, id: genId(), createdAt: "2026-09-14" };
    setRentals((rs) => [r, ...rs]);
    addToast("Đặt thuê thành công! Chờ chủ xác nhận.", "success");
    addNotification("Đơn " + r.id + " đã được gửi tới chủ");
  }

  function handleRentalUpdate(id: string, status: Rental["status"]) {
    setRentals((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
  }

  function handleItemSave(data: Partial<Item>, existing?: Item) {
    if (existing) {
      setItems((is) => is.map((i) => i.id === existing.id ? { ...i, ...data } : i));
      addToast("Đã cập nhật sản phẩm!", "success");
    } else {
      const newItem: Item = {
        id: Date.now(), ownerId: user!.id, ownerName: user!.name,
        rating: 0, reviewCount: 0, status: "ACTIVE",
        img: data.img ?? "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=750&fit=crop&auto=format",
        title: data.title ?? "", category: data.category ?? CATEGORIES[0],
        description: data.description ?? "", dailyPrice: data.dailyPrice ?? 0,
        deposit: data.deposit ?? 0, location: data.location ?? "", tags: data.tags ?? [],
      };
      setItems((is) => [newItem, ...is]);
      addToast("Sản phẩm đã được đăng!", "success");
    }
  }

  function handleItemDelete(id: number) {
    setItems((is) => is.filter((i) => i.id !== id));
    addToast("Đã xóa sản phẩm", "info");
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }`}</style>

      <Navbar user={user} onAuthClick={() => setAuthOpen(true)} onLogout={handleLogout}
        notifications={notifications} onNotifClick={markAllRead} unreadCount={unreadCount}
        screen={screen} setScreen={(s) => {
          if (s === "owner" && !user) { setAuthOpen(true); return; }
          if (s === "detail" && !selectedItem) { setSelectedItem(items[0]); }
          setScreen(s);
        }} />

      {screen === "explore" && (
        <ExploreScreen items={items} onSelect={handleSelect} user={user} onAuthClick={() => setAuthOpen(true)} />
      )}
      {screen === "detail" && selectedItem && (
        <DetailScreen item={selectedItem} onBack={() => setScreen("explore")} reviews={reviews}
          user={user} onBookingConfirm={handleBookingConfirm} onAuthClick={() => setAuthOpen(true)} />
      )}
      {screen === "owner" && user && (
        <OwnerDashboard user={user} items={items} rentals={rentals} reviews={reviews}
          onRentalUpdate={(id, status) => { handleRentalUpdate(id, status); }}
          onItemSave={handleItemSave} onItemDelete={handleItemDelete}
          addNotification={addNotification} />
      )}

      {/* Floating screen switcher (dev convenience) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 bg-[#2A1F1A]/90 backdrop-blur px-3 py-2 rounded-full shadow-xl">
        {([["explore","Khám phá"],["detail","Chi tiết"],["owner","Owner"]] as const).map(([s, l]) => (
          <button key={s} onClick={() => {
            if (s === "owner" && !user) { setAuthOpen(true); return; }
            if (s === "detail" && !selectedItem) setSelectedItem(items[0]);
            setScreen(s);
          }} className={`text-xs px-3 py-1.5 rounded-full transition-all ${screen === s ? "bg-[#C4602A] text-white" : "text-[#8C7B72] hover:text-white"}`}>{l}</button>
        ))}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} />
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
