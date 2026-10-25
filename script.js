
/* =========================================================
   SISTEM INVENTARIS ASET PT. ZEEA
   Frontend: HTML + CSS + JavaScript
   Database: Supabase PostgreSQL
   ========================================================= */

/* 1. KONFIGURASI SUPABASE
   Ambil URL dan publishable/anon key dari dashboard Supabase.
   Jangan gunakan service_role key di frontend.
*/
const SUPABASE_URL = "https://trozhgvjemrghfxudheq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hvuj6-ywD1hJtEd1RNfquw_yVmH_5tB";

let supabaseClient = null;
let assets = [];
let categories = [];
let disposals = [];

const $ = (id) => document.getElementById(id);

const PAGE_TITLES = {
  dashboard: "Dashboard",
  assets: "Data Aset",
  disposal: "Disposal",
  damaged: "Aset Rusak",
  categories: "Kategori"
};

/* 2. FUNGSI UMUM */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatDate(value) {
  if (!value) return "-";
  const parts = String(value).split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID");
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function showAlert(message, type = "success") {
  const area = $("alert-area");
  if (!area) return;

  area.innerHTML = `
    <div class="alert ${type}">
      <span>${escapeHTML(message)}</span>
      <button class="alert-close" type="button" aria-label="Tutup">×</button>
    </div>
  `;

  area.querySelector(".alert-close")?.addEventListener("click", () => {
    area.innerHTML = "";
  });

  window.setTimeout(() => {
    if (area.querySelector(".alert")) area.innerHTML = "";
  }, 6000);
}

function showModal(id) {
  $(id)?.classList.add("open");
}

function closeModal(id) {
  $(id)?.classList.remove("open");
}

function getCategoryName(asset) {
  return asset.kategori?.nama_kategori
    || categories.find((category) => category.id === asset.kategori_id)?.nama_kategori
    || "-";
}

function statusBadge(status) {
  const map = {
    Baik: "good",
    Rusak: "danger",
    Disposal: "neutral"
  };
  return `<span class="badge ${map[status] || "neutral"}">${escapeHTML(status || "Belum diisi")}</span>`;
}

function setButtonLoading(button, loading, loadingText = "Menyimpan...") {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

/* 3. PERHITUNGAN MASA MANFAAT
   Menggunakan tanggal kalender lokal untuk menghindari pergeseran
   tanggal akibat zona waktu.
*/
function endOfUsefulLife(asset) {
  if (!asset?.tanggal_perolehan) return null;

  const parts = String(asset.tanggal_perolehan).split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const life = Number(asset.masa_manfaat_tahun);

  if (!year || !month || !day || !Number.isFinite(life) || life < 1) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setFullYear(date.getFullYear() + Math.floor(life));
  return date;
}

function daysUntil(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - today) / 86400000);
}

function getUsefulLifeStatus(asset) {
  const endDate = endOfUsefulLife(asset);

  if (!endDate) {
    return {
      date: "-",
      days: null,
      label: "Tanggal belum valid",
      className: "neutral"
    };
  }

  const days = daysUntil(endDate);

  if (days < 0) {
    return {
      date: formatDate(
        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
      ),
      days,
      label: "Masa manfaat terlewati",
      className: "danger"
    };
  }

  if (days <= 180) {
    return {
      date: formatDate(
        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
      ),
      days,
      label: "Segera berakhir",
      className: "warning"
    };
  }

  return {
    date: formatDate(
      `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
    ),
    days,
    label: "Masih dalam masa manfaat",
    className: "good"
  };
}

/* 4. AMBIL DATA DARI SUPABASE */

async function loadAssets() {
  const { data, error } = await supabaseClient
    .from("aset")
    .select("*, kategori(nama_kategori)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Gagal memuat aset: ${error.message}`);
  assets = data || [];
}

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("kategori")
    .select("*")
    .order("nama_kategori", { ascending: true });

  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  categories = data || [];
}

async function loadDisposals() {
  const { data, error } = await supabaseClient
    .from("disposal")
    .select("*, aset(kode_aset, nama_aset)")
    .order("tanggal_disposal", { ascending: false });

  if (error) throw new Error(`Gagal memuat data disposal: ${error.message}`);
  disposals = data || [];
}

async function refreshData() {
  await Promise.all([loadCategories(), loadAssets(), loadDisposals()]);
  renderAll();
}

/* 5. DASHBOARD DAN PENGINGAT MASA MANFAAT */

function renderDashboard() {
  const usableAssets = assets.filter((asset) => asset.kondisi === "Baik");
  const damagedAssets = assets.filter((asset) => asset.kondisi === "Rusak");
  const disposedAssets = assets.filter((asset) => asset.kondisi === "Disposal");

  $("total-aset").textContent = assets.length;
const totalNilaiAset = assets.reduce((total, asset) => {
  return total + (Number(asset.harga_perolehan) || 0);
}, 0);

$("total-nilai-aset").textContent = formatRupiah(totalNilaiAset);
  $("total-bisa-dipakai").textContent = usableAssets.length;
  $("total-rusak").textContent = damagedAssets.length;
  $("total-sudah-dilepas").textContent = disposedAssets.length;
  $("total-kategori").textContent = categories.length;

  const tbody = $("expiry-table-body");
  if (!tbody) return;

  // Tampilkan semua aset yang belum dilepas, bukan hanya yang
  // masa manfaatnya berakhir dalam 180 hari.
  const activeAssets = assets
    .filter((asset) => asset.kondisi !== "Disposal")
    .map((asset) => ({
      asset,
      status: getUsefulLifeStatus(asset)
    }))
    .sort((a, b) => {
      if (a.status.days === null) return 1;
      if (b.status.days === null) return -1;
      return a.status.days - b.status.days;
    });

  if (activeAssets.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="4" class="empty-state">
        Belum ada aset aktif. Tambahkan data aset terlebih dahulu.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = activeAssets.map(({ asset, status }) => `
    <tr>
      <td>${escapeHTML(asset.kode_aset || "-")}</td>
      <td>${escapeHTML(asset.nama_aset || "-")}</td>
      <td>${escapeHTML(status.date)}</td>
      <td><span class="badge ${status.className}">${escapeHTML(status.label)}</span></td>
    </tr>
  `).join("");
}

/* 6. TABEL DATA ASET */

function renderAssets() {
  const tbody = $("assets-table-body");
  if (!tbody) return;

  const query = ($("asset-search")?.value || "").trim().toLowerCase();
  const filter = $("asset-filter")?.value || "";

  const filtered = assets.filter((asset) => {
    const text = `${asset.kode_aset || ""} ${asset.nama_aset || ""} ${getCategoryName(asset)}`.toLowerCase();
    return text.includes(query) && (!filter || asset.kondisi === filter);
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Tidak ada data aset yang cocok.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((asset) => `
    <tr>
      <td>${escapeHTML(asset.kode_aset || "-")}</td>
      <td>${escapeHTML(asset.nama_aset || "-")}</td>
      <td>${escapeHTML(getCategoryName(asset))}</td>
      <td>${escapeHTML(formatDate(asset.tanggal_perolehan))}</td>
      <td>${statusBadge(asset.kondisi)}</td>
      <td>${escapeHTML(asset.lokasi || "-")}</td>
      <td>
        <div class="table-actions">
          <button class="action-button" data-action="edit-asset" data-id="${escapeHTML(asset.id)}">Edit</button>
          <button class="action-button" data-action="delete-asset" data-id="${escapeHTML(asset.id)}">Hapus</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* 7. TABEL DISPOSAL */

function renderDisposals() {
  const tbody = $("disposal-table-body");
  if (!tbody) return;

  const query = ($("disposal-search")?.value || "").trim().toLowerCase();
  const filtered = disposals.filter((item) => {
    const asset = item.aset || assets.find((a) => a.id === item.aset_id);
    const text = `${asset?.kode_aset || ""} ${asset?.nama_aset || ""} ${item.alasan || ""}`.toLowerCase();
    return text.includes(query);
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada data disposal.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((item) => {
    const asset = item.aset || assets.find((a) => a.id === item.aset_id);
    return `
      <tr>
        <td>${escapeHTML(asset?.kode_aset || "-")}</td>
        <td>${escapeHTML(asset?.nama_aset || "-")}</td>
        <td>${escapeHTML(formatDate(item.tanggal_disposal))}</td>
        <td>${escapeHTML(item.alasan || "-")}</td>
        <td>${escapeHTML(formatRupiah(item.nilai_jual))}</td>
      </tr>
    `;
  }).join("");
}

/* 8. TABEL ASET RUSAK */

function renderDamaged() {
  const tbody = $("damaged-table-body");
  if (!tbody) return;

  const query = ($("damaged-search")?.value || "").trim().toLowerCase();
  const damaged = assets.filter((asset) => {
    const text = `${asset.kode_aset || ""} ${asset.nama_aset || ""} ${getCategoryName(asset)} ${asset.lokasi || ""}`.toLowerCase();
    return asset.kondisi === "Rusak" && text.includes(query);
  });

  if (!damaged.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Tidak ada aset rusak yang tercatat.</td></tr>`;
    return;
  }

  tbody.innerHTML = damaged.map((asset) => `
    <tr>
      <td>${escapeHTML(asset.kode_aset || "-")}</td>
      <td>${escapeHTML(asset.nama_aset || "-")}</td>
      <td>${escapeHTML(getCategoryName(asset))}</td>
      <td>${escapeHTML(asset.lokasi || "-")}</td>
      <td>${escapeHTML(asset.keterangan || "-")}</td>
      <td><button class="action-button" data-action="edit-condition" data-id="${escapeHTML(asset.id)}">Perbarui Kondisi</button></td>
    </tr>
  `).join("");
}

/* 9. TAMPILAN KATEGORI */

function renderCategories() {
  const grid = $("category-grid");
  if (!grid) return;

  if (!categories.length) {
    grid.innerHTML = `<div class="empty-card">Belum ada kategori. Klik “Tambah Kategori” untuk membuat kategori baru.</div>`;
    return;
  }

  grid.innerHTML = categories.map((category, index) => {
    const count = assets.filter((asset) => String(asset.kategori_id) === String(category.id)).length;
    const symbols = ["▦", "⌘", "▤", "◇", "✦", "◈"];

    return `
      <article class="category-card">
        <div class="category-symbol">${symbols[index % symbols.length]}</div>
        <h3>${escapeHTML(category.nama_kategori || "Kategori")}</h3>
        <p>${escapeHTML(category.deskripsi || "Tidak ada deskripsi kategori.")}</p>
        <div class="category-count">${count} aset terdaftar</div>
      </article>
    `;
  }).join("");
}

function renderAll() {
  renderDashboard();
  renderAssets();
  renderDisposals();
  renderDamaged();
  renderCategories();
  updateSelectOptions();
}

/* 10. DROPDOWN KATEGORI DAN ASET */

function updateSelectOptions() {
  const categorySelect = $("asset-category");
  if (categorySelect) {
    const previousValue = categorySelect.value;
    categorySelect.innerHTML = `<option value="">Pilih kategori</option>` +
      categories.map((category) => `
        <option value="${escapeHTML(category.id)}">${escapeHTML(category.nama_kategori)}</option>
      `).join("");
    categorySelect.value = previousValue;
  }

  const disposalSelect = $("disposal-asset");
  if (disposalSelect) {
    const previousValue = disposalSelect.value;
    const eligible = assets.filter((asset) => asset.kondisi !== "Disposal");
    disposalSelect.innerHTML = `<option value="">Pilih aset</option>` +
      eligible.map((asset) => `
        <option value="${escapeHTML(asset.id)}">${escapeHTML(asset.kode_aset)} — ${escapeHTML(asset.nama_aset)}</option>
      `).join("");
    disposalSelect.value = previousValue;
  }
}

/* 11. SIMPAN ASET BARU ATAU EDIT ASET */

function openAssetForm(asset = null) {
  $("asset-form").reset();
  $("asset-id").value = asset?.id || "";
  $("asset-modal-title").textContent = asset ? "Edit Aset" : "Tambah Aset";
  $("save-asset-btn").textContent = asset ? "Simpan Perubahan" : "Simpan Aset";

  $("asset-code").value = asset?.kode_aset || "";
  $("asset-name").value = asset?.nama_aset || "";
  $("asset-category").value = asset?.kategori_id || "";
  $("asset-date").value = asset?.tanggal_perolehan || "";
  $("asset-price").value = asset?.harga_perolehan ?? 0;
  $("asset-life").value = asset?.masa_manfaat_tahun ?? 5;
  $("asset-condition").value = asset?.kondisi || "Baik";
  $("asset-location").value = asset?.lokasi || "";
  $("asset-notes").value = asset?.keterangan || "";

  showModal("asset-modal");
}

async function saveAsset(event) {
  event.preventDefault();

  const button = $("save-asset-btn");
  setButtonLoading(button, true);

  const id = $("asset-id").value;
  const payload = {
    kode_aset: $("asset-code").value.trim(),
    nama_aset: $("asset-name").value.trim(),
    kategori_id: $("asset-category").value,
    tanggal_perolehan: $("asset-date").value,
    harga_perolehan: Number($("asset-price").value) || 0,
    masa_manfaat_tahun: Number($("asset-life").value),
    kondisi: $("asset-condition").value,
    lokasi: $("asset-location").value.trim() || null,
    keterangan: $("asset-notes").value.trim() || null
  };

  try {
    if (!payload.kategori_id) throw new Error("Silakan pilih kategori aset.");
    if (!payload.tanggal_perolehan) throw new Error("Tanggal perolehan wajib diisi.");
    if (payload.masa_manfaat_tahun < 1) throw new Error("Masa manfaat minimal 1 tahun.");

    let result;
    if (id) {
      result = await supabaseClient.from("aset").update(payload).eq("id", id);
    } else {
      result = await supabaseClient.from("aset").insert(payload);
    }

    if (result.error) throw result.error;

    closeModal("asset-modal");
    await refreshData();
    showAlert(id ? "Data aset berhasil diperbarui." : "Aset baru berhasil ditambahkan.");
  } catch (error) {
    showAlert(error.message || "Gagal menyimpan data aset.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteAsset(id) {
  const asset = assets.find((item) => String(item.id) === String(id));
  if (!asset) return;

  const confirmed = window.confirm(
    `Hapus aset "${asset.nama_aset}"?\n\nJika aset memiliki riwayat disposal atau riwayat kondisi, penghapusan bisa ditolak oleh database.`
  );
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient.from("aset").delete().eq("id", id);
    if (error) throw error;

    await refreshData();
    showAlert("Data aset berhasil dihapus.");
  } catch (error) {
    showAlert(`Aset tidak dapat dihapus: ${error.message}`, "error");
  }
}

/* 12. TAMBAH KATEGORI */

async function saveCategory(event) {
  event.preventDefault();

  const name = $("category-name").value.trim();
  const description = $("category-description").value.trim();

  if (!name) {
    showAlert("Nama kategori wajib diisi.", "error");
    return;
  }

  try {
    const { error } = await supabaseClient.from("kategori").insert({
      nama_kategori: name,
      deskripsi: description || null
    });

    if (error) throw error;

    closeModal("category-modal");
    $("category-form").reset();
    await refreshData();
    showAlert("Kategori berhasil ditambahkan.");
  } catch (error) {
    showAlert(`Gagal menambahkan kategori: ${error.message}`, "error");
  }
}

/* 13. DISPOSAL ASET */

async function saveDisposal(event) {
  event.preventDefault();

  const assetId = $("disposal-asset").value;
  const date = $("disposal-date").value;
  const reason = $("disposal-reason").value.trim();
  const value = Number($("disposal-value").value) || 0;

  if (!assetId || !date || !reason) {
    showAlert("Lengkapi aset, tanggal, dan alasan disposal.", "error");
    return;
  }

  const asset = assets.find((item) => String(item.id) === String(assetId));
  if (!asset) {
    showAlert("Aset tidak ditemukan. Muat ulang data lalu coba lagi.", "error");
    return;
  }

  try {
    // Catat disposal terlebih dahulu.
    const { error: disposalError } = await supabaseClient
      .from("disposal")
      .insert({
        aset_id: assetId,
        tanggal_disposal: date,
        alasan: reason,
        nilai_jual: value
      });

    if (disposalError) throw disposalError;

    // Setelah catatan disposal tersimpan, ubah kondisi aset.
    const { error: assetError } = await supabaseClient
      .from("aset")
      .update({ kondisi: "Disposal" })
      .eq("id", assetId);

    closeModal("disposal-modal");
    $("disposal-form").reset();

    await refreshData();

    if (assetError) {
      showAlert(
        `Catatan disposal tersimpan, tetapi kondisi aset belum berhasil diubah. Perbarui kondisi aset secara manual. Detail: ${assetError.message}`,
        "error"
      );
      return;
    }

    showAlert("Disposal berhasil dicatat dan kondisi aset telah diperbarui.");
  } catch (error) {
    showAlert(`Gagal mencatat disposal: ${error.message}`, "error");
  }
}

/* 14. PERBARUI KONDISI ASET */

function openConditionForm(id) {
  const asset = assets.find((item) => String(item.id) === String(id));
  if (!asset) return;

  $("condition-asset-id").value = asset.id;
  $("condition-asset-name").value = asset.nama_aset || "";
  $("condition-new-value").value = asset.kondisi === "Rusak" ? "Baik" : "Rusak";
  $("condition-notes").value = "";
  showModal("condition-modal");
}

async function saveCondition(event) {
  event.preventDefault();

  const id = $("condition-asset-id").value;
  const newCondition = $("condition-new-value").value;
  const notes = $("condition-notes").value.trim();
  const asset = assets.find((item) => String(item.id) === String(id));

  if (!asset) {
    showAlert("Data aset tidak ditemukan.", "error");
    return;
  }

  if (asset.kondisi === "Disposal") {
    showAlert("Aset yang sudah dilepas tidak bisa diubah melalui menu kondisi rusak.", "error");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("aset")
      .update({
        kondisi: newCondition,
        keterangan: notes || asset.keterangan || null
      })
      .eq("id", id);

    if (error) throw error;

    // Catat riwayat bila tabel riwayat_kondisi tersedia.
    // Jika struktur tabel berbeda atau akses ditolak, tampilkan pesan yang jelas.
    const { error: historyError } = await supabaseClient
      .from("riwayat_kondisi")
      .insert({
        aset_id: id,
        kondisi: newCondition,
        tanggal_perubahan: todayISO(),
        keterangan: notes || null
      });

    closeModal("condition-modal");
    await refreshData();

    if (historyError) {
      showAlert(
        `Kondisi aset berhasil diubah, tetapi riwayat kondisi belum tersimpan: ${historyError.message}`,
        "error"
      );
    } else {
      showAlert("Kondisi aset berhasil diperbarui.");
    }
  } catch (error) {
    showAlert(`Gagal memperbarui kondisi aset: ${error.message}`, "error");
  }
}

/* 15. NAVIGASI ANTARHALAMAN */

function navigateTo(page) {
  if (!PAGE_TITLES[page]) return;

  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.toggle("active", section.id === `page-${page}`);
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("page-title").textContent = PAGE_TITLES[page];
  $("breadcrumb-current").textContent = PAGE_TITLES[page];
  $("sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* 16. PASANG EVENT LISTENER */

function bindEvents() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.dataset.page));
  });

  document.querySelectorAll("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.dataset.openPage));
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal(backdrop.id);
    });
  });

  $("mobile-menu")?.addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });

  $("add-asset-btn")?.addEventListener("click", () => openAssetForm());
  $("add-category-btn")?.addEventListener("click", () => {
    $("category-form").reset();
    showModal("category-modal");
  });
  $("add-disposal-btn")?.addEventListener("click", () => {
    $("disposal-form").reset();
    $("disposal-date").value = todayISO();
    updateSelectOptions();
    showModal("disposal-modal");
  });

  $("asset-form")?.addEventListener("submit", saveAsset);
  $("category-form")?.addEventListener("submit", saveCategory);
  $("disposal-form")?.addEventListener("submit", saveDisposal);
  $("condition-form")?.addEventListener("submit", saveCondition);

  $("asset-search")?.addEventListener("input", renderAssets);
  $("asset-filter")?.addEventListener("change", renderAssets);
  $("disposal-search")?.addEventListener("input", renderDisposals);
  $("damaged-search")?.addEventListener("input", renderDamaged);

  // Delegasi klik tombol aksi pada tabel aset.
  $("assets-table-body")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === "edit-asset") {
      const asset = assets.find((item) => String(item.id) === String(id));
      if (asset) openAssetForm(asset);
    } else if (action === "delete-asset") {
      deleteAsset(id);
    }
  });

  $("damaged-table-body")?.addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="edit-condition"]');
    if (button) openConditionForm(button.dataset.id);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.open").forEach((modal) => closeModal(modal.id));
      $("sidebar").classList.remove("open");
    }
  });
}

/* 17. MULAI APLIKASI */

async function initApp() {
  $("current-date").textContent = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  $("footer-year").textContent = new Date().getFullYear();

  bindEvents();

  if (
    SUPABASE_URL.includes("MASUKKAN_") ||
    SUPABASE_ANON_KEY.includes("MASUKKAN_") ||
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY
  ) {
    showAlert(
      "Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di file script.js.",
      "error"
    );
    $("expiry-table-body").innerHTML =
      `<tr><td colspan="4" class="empty-state">Hubungkan Supabase untuk menampilkan pengingat masa manfaat.</td></tr>`;
    return;
  }

  if (!window.supabase?.createClient) {
    showAlert("Library Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.", "error");
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    await refreshData();
  } catch (error) {
    console.error("Kesalahan saat memuat data Supabase:", error);
    showAlert(
      `Data gagal dimuat. Periksa nama tabel, kolom, koneksi, dan kebijakan akses Supabase. Detail: ${error.message}`,
      "error"
    );
    $("expiry-table-body").innerHTML =
      `<tr><td colspan="4" class="empty-state">Data belum dapat dimuat. Periksa pesan kesalahan pada browser.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", initApp);
