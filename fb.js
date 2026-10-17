// Firebase backend for Carrot Cake Litter Diary.
// Provides the small `window.claude.use(...)` surface the app was written against
// (db / user / assets), backed by Firestore + Firebase Auth (email-link sign-in).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink, signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, query, limit as qLimit, onSnapshot, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, deleteField, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, OWNER_EMAIL, DEFAULT_LITTER } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let fs;
try {
  fs = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (_) {
  fs = initializeFirestore(app, { ignoreUndefinedProperties: true });
}

const $ = (id) => document.getElementById(id);
const show = (id) => { for (const x of ["boot", "login", "app"]) $(x).hidden = x !== id; };

/* ---------------- current litter ---------------- */
let L = DEFAULT_LITTER;
try { L = localStorage.getItem("litter") || DEFAULT_LITTER; } catch (_) {}
window.__litter = L;

const ABS = /^(dossiers|roles|photos|litters)(\/|$)/;
const abs = (p) => (ABS.test(p) ? p : `litters/${L}/${p}`);

/* ---------------- db shim ---------------- */
const mapErr = (e) => ({
  code: e && e.code === "permission-denied" ? "invalid_argument"
      : e && e.code === "resource-exhausted" ? "quota_exceeded" : "unavailable",
  message: (e && e.message) || "",
});
const wrapDoc = (s) => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: s.metadata });
const wrapQuery = (q) => ({ docs: q.docs.map(wrapDoc), size: q.size, empty: q.empty, metadata: q.metadata });

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix + k;
    if (v && typeof v === "object" && v.__delete__ === true) out[key] = deleteField();
    else if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length && Object.getPrototypeOf(v) === Object.prototype) flatten(v, key + ".", out);
    else out[key] = v;
  }
  return out;
}

function docRef(path) {
  const ref = doc(fs, abs(path));
  return {
    id: ref.id, path,
    get: async () => wrapDoc(await getDoc(ref)),
    set: async (data) => {
      try { await setDoc(ref, data); } catch (e) { throw mapErr(e); }
      if (path === "meta/litter") {
        try { await setDoc(doc(fs, `litters/${L}`), { name: data.name || "", breed: data.breed || "", birthDate: data.birthDate || "" }, { merge: true }); } catch (_) {}
      }
    },
    update: async (data) => { try { await updateDoc(ref, flatten(data)); } catch (e) { throw mapErr(e); } },
    delete: async () => { try { await deleteDoc(ref); } catch (e) { throw mapErr(e); } },
    onSnapshot: (next, err) => onSnapshot(ref, (s) => next(wrapDoc(s)), (e) => err && err(mapErr(e))),
    collection: (sub) => collRef(`${path}/${sub}`),
  };
}
function queryObj(qq) {
  return {
    get: async () => wrapQuery(await getDocs(qq)),
    onSnapshot: (next, err) => onSnapshot(qq, (q) => next(wrapQuery(q)), (e) => err && err(mapErr(e))),
  };
}
function collRef(path) {
  const ref = collection(fs, abs(path));
  return {
    path,
    doc: (id) => (id ? docRef(`${path}/${id}`) : docRef(`${path}/${doc(ref).id}`)),
    add: async (data) => { const d = docRef(`${path}/${doc(ref).id}`); await d.set(data); return d; },
    limit: (n) => queryObj(query(ref, qLimit(n))),
    ...queryObj(ref),
  };
}
const DB = { doc: docRef, collection: collRef };

/* ---------------- photos (stored in Firestore — Spark plan has no Storage) ---------------- */
const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function recompress(dataUrl, q) {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext("2d").drawImage(img, 0, 0);
  return c.toDataURL("image/jpeg", q);
}
const ASSETS = {
  async upload(blob, meta = {}) {
    let data = await blobToDataURL(blob);
    for (const q of [0.75, 0.6, 0.45]) { if (data.length < 900000) break; data = await recompress(data, q); }
    if (data.length >= 1000000) throw { code: "too_large", message: "Снимката е твърде голяма." };
    const ref = doc(collection(fs, "photos"));
    await setDoc(ref, { data, pid: meta.pid || "", litter: L, ts: Date.now() });
    PHOTO.set(ref.id, data);
    return { id: ref.id, url: data };
  },
  async delete(id) { await deleteDoc(doc(fs, `photos/${id}`)); PHOTO.delete(id); },
};
const PHOTO = new Map(); const PENDING = new Set(); let rerenderT = null;
const TRANSPARENT = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
window.__bu = (id) => {
  if (PHOTO.has(id)) return PHOTO.get(id);
  if (!PENDING.has(id)) {
    PENDING.add(id);
    getDoc(doc(fs, `photos/${id}`)).then((s) => {
      PHOTO.set(id, s.exists() ? s.data().data : TRANSPARENT);
      clearTimeout(rerenderT); rerenderT = setTimeout(() => window.render && window.render(), 60);
    }).catch(() => PHOTO.set(id, TRANSPARENT));
  }
  return TRANSPARENT;
};

/* ---------------- roles ---------------- */
let ROLE = "viewer", EMAIL = "";
const USER = {
  can: async (c) => (c === "data.write" ? ROLE !== "viewer" : null),
  isOwner: async () => ROLE === "owner",
  canEdit: async () => ROLE !== "viewer",
  id: async () => EMAIL || null,
  profiles: async () => ({}),
  search: async () => [],
};
window.__roles = {
  add: (em) => setDoc(doc(fs, `roles/${em.toLowerCase()}`), { role: "editor", added: Date.now() }),
  remove: (em) => deleteDoc(doc(fs, `roles/${em.toLowerCase()}`)),
};

window.claude = { use: async (n) => (n === "db" ? DB : n === "user" ? USER : n === "assets" ? (ROLE === "viewer" ? null : ASSETS) : null) };

/* ---------------- import (one-off migration) ---------------- */
window.__importLitter = async (data) => {
  if (ROLE !== "owner") throw new Error("само собственикът може да импортира");
  const ops = [];
  if (data.meta && data.meta.litter) ops.push([`litters/${L}/meta/litter`, data.meta.litter]);
  for (const col of ["puppies", "weights", "events", "deworm"])
    for (const r of data[col] || []) ops.push([`litters/${L}/${col}/${r.id}`, r.data]);
  const name = (data.meta && data.meta.litter && data.meta.litter.name) || "Кучило";
  ops.push([`litters/${L}`, { name, breed: (data.meta && data.meta.litter && data.meta.litter.breed) || "", birthDate: (data.meta && data.meta.litter && data.meta.litter.birthDate) || "" }]);
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(fs);
    for (const [p, d] of ops.slice(i, i + 400)) b.set(doc(fs, p), d);
    await b.commit();
  }
  alert(`Импортирани ${ops.length} записа.`);
  location.reload();
};

/* ---------------- litter switcher (admins) ---------------- */
function mountLitterSwitcher() {
  onSnapshot(collection(fs, "litters"), (q) => {
    const list = q.docs.map((d) => ({ id: d.id, name: d.data().name || d.id, bd: d.data().birthDate || "" }))
      .sort((a, b) => (a.bd < b.bd ? 1 : -1));
    if (!list.some((x) => x.id === L)) list.unshift({ id: L, name: "Текущо кучило" });
    const opts = list.map((x) => `<option value="${x.id}" ${x.id === L ? "selected" : ""}>Кучило „${(x.name || "").replace(/[<&"]/g, "")}“</option>`).join("");
    $("litSel").innerHTML = `<select id="litPick" aria-label="Кучило">${opts}${ROLE === "owner" ? '<option value="__new">+ Ново кучило</option>' : ""}</select>`;
  }, () => {});
  document.addEventListener("change", async (e) => {
    if (e.target.id !== "litPick") return;
    let v = e.target.value;
    if (v === "__new") {
      const ref = doc(collection(fs, "litters"));
      await setDoc(ref, { name: "Ново кучило", created: Date.now() });
      v = ref.id;
    }
    try { localStorage.setItem("litter", v); } catch (_) {}
    location.reload();
  });
}

/* ---------------- auth flow ---------------- */
const LINK_KEY = "emailForSignIn";
async function completeLinkIfAny() {
  if (!isSignInWithEmailLink(auth, location.href)) return false;
  let email = "";
  try { email = localStorage.getItem(LINK_KEY) || ""; } catch (_) {}
  if (!email) {
    show("login");
    $("loginTitle").textContent = "Потвърди имейла";
    $("loginText").textContent = "Отвори линка на друго устройство? Въведи същия имейл, за да влезеш.";
    $("loginBtn").textContent = "Влез";
    $("loginForm").dataset.mode = "confirm";
    return true;
  }
  await finishLink(email);
  return true;
}
async function finishLink(email) {
  try {
    await signInWithEmailLink(auth, email, location.href);
    try { localStorage.removeItem(LINK_KEY); } catch (_) {}
    history.replaceState(null, "", location.pathname);
  } catch (e) {
    show("login");
    $("loginMsg").textContent = "Линкът е невалиден или изтекъл. Поискай нов.";
  }
}
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("loginEmail").value.trim().toLowerCase();
  if (!email) return;
  if ($("loginForm").dataset.mode === "confirm") { await finishLink(email); return; }
  $("loginBtn").disabled = true;
  try {
    await sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
    try { localStorage.setItem(LINK_KEY, email); } catch (_) {}
    $("loginMsg").textContent = `Изпратихме линк за вход на ${email}. Отвори го от имейла (провери и Спам).`;
  } catch (err) {
    $("loginMsg").textContent = "Не успяхме да изпратим линк: " + (err.code || err.message);
  }
  $("loginBtn").disabled = false;
});
$("signOut").addEventListener("click", () => signOut(auth).then(() => location.reload()));

let started = false;
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    if (!(await completeLinkIfAny())) show("login");
    return;
  }
  if (started) return; started = true;
  EMAIL = (u.email || "").toLowerCase();
  if (EMAIL === OWNER_EMAIL) ROLE = "owner";
  else {
    try { const r = await getDoc(doc(fs, `roles/${EMAIL}`)); ROLE = r.exists() ? "editor" : "viewer"; } catch (_) { ROLE = "viewer"; }
  }
  $("whoami").textContent = EMAIL + (ROLE === "owner" ? " · собственик" : ROLE === "editor" ? " · editor" : "");
  show("app");
  if (ROLE !== "viewer") mountLitterSwitcher();
  if (ROLE === "owner") {
    onSnapshot(collection(fs, "roles"), (q) => { S.editors = q.docs.map((d) => d.id); window.render && window.render(); }, () => {});
  }
  await window.__init();
});
